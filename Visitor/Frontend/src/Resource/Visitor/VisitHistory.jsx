import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, ArrowUpDown, User, Eye, Edit3, RefreshCw, Mail, Phone, MapPin, Building2, CreditCard, QrCode, FileText, Plus, Trash2 } from 'lucide-react';
import { visitorPortalApi } from '../../services/api';
import { visitorHistoryApi } from '../../modules/visitor-history/api/visitorHistoryApi';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import EditAppointmentModal from './components/EditAppointmentModal';
import AddOtherVisitorInfoModal from './components/AddOtherVisitorInfoModal';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import BackButton from '../../components/common/BackButton';
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string')
        return false;
    const clean = url.trim();
    if (!clean || clean.includes('/uploads/mock-'))
        return false;
    if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('./'))
        return true;
    if (/\.(jpg|jpeg|png|webp|gif|svg|bmp|ico)/i.test(clean))
        return true;
    return false;
};
const getInitials = (name) => {
    if (!name)
        return 'V';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
};
const DEFAULT_HISTORY_RECORDS = [];
export default function VisitHistory() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [, setSearchParams] = useSearchParams();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [editingAppt, setEditingAppt] = useState(null);
    const [isAddInfoModalOpen, setIsAddInfoModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState(null);
    const [sortBy, setSortBy] = useState('historyCode');
    const [sortOrder, setSortOrder] = useState('desc');
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        let records = [];
        let profileData = null;
        let userFromStorage = null;
        let registeredData = null;
        try {
            const uStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (uStr)
                userFromStorage = JSON.parse(uStr);
            const regRaw = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data') || sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            if (regRaw)
                registeredData = JSON.parse(regRaw);
        }
        catch (e) { }
        try {
            const profileRes = await visitorPortalApi.getProfile();
            if (profileRes.data) {
                profileData = profileRes.data;
            }
        }
        catch (e) {
            console.warn('Failed to load profile details:', e);
        }
        const currentEmail = (user?.email || userFromStorage?.email || profileData?.email || '').toLowerCase();
        const currentUserId = user?.id || userFromStorage?.id || 1;
        // Discard registeredData if it belongs to a different email
        if (registeredData) {
            const rEmail = (registeredData.email || '').toLowerCase();
            if (rEmail && currentEmail && rEmail !== currentEmail) {
                registeredData = null;
            }
        }
        const authName = userFromStorage?.fullName || userFromStorage?.full_name || profileData?.full_name || registeredData?.visitorName || registeredData?.fullName || registeredData?.full_name || 'Visitor';
        const authEmail = currentEmail || registeredData?.email || '';
        const authPhone = userFromStorage?.phone || profileData?.phone || registeredData?.phone || registeredData?.visitor_phone || '-';
        const authCompany = profileData?.company || registeredData?.company || registeredData?.visitor_company || 'IT Park';
        const authIdType = profileData?.id_type || registeredData?.idType || registeredData?.identityType || registeredData?.id_type || 'National ID';
        const authIdNum = profileData?.id_number || registeredData?.idNumber || registeredData?.identityNumber || registeredData?.id_number || 'Not provided';
        const authPhoto = (() => {
            const explicit = sessionStorage.getItem('visitor_uploaded_photo') ||
                localStorage.getItem('visitor_uploaded_photo') ||
                (currentUserId ? sessionStorage.getItem(`user_photo_${currentUserId}`) : null) ||
                (currentUserId ? localStorage.getItem(`user_photo_${currentUserId}`) : null);
            if (explicit && isValidImageUrl(explicit))
                return explicit;
            try {
                const raw = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile') || sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const pEmail = (parsed.email || '').toLowerCase().trim();
                    if (!pEmail || !currentEmail || pEmail === currentEmail) {
                        const ph = parsed.photoUrl || parsed.photo_url || parsed.avatarUrl || parsed.photo || parsed.visitorPhoto;
                        if (ph && isValidImageUrl(ph))
                            return ph;
                    }
                }
            }
            catch (e) { }
            const userObjPhoto = userFromStorage?.profile_photo || userFromStorage?.avatarUrl || userFromStorage?.photo_url || userFromStorage?.photoUrl || userFromStorage?.avatar;
            if (userObjPhoto && isValidImageUrl(userObjPhoto))
                return userObjPhoto;
            return profileData?.photo_url || '';
        })();
        const authCategory = registeredData?.category || registeredData?.visitor_category || profileData?.category || '-';
        const authHost = registeredData?.hostName || registeredData?.host_employee_name || '-';
        const authDept = registeredData?.department || registeredData?.department_name || '-';
        const authPurpose = registeredData?.purposeOfVisit || registeredData?.purpose || registeredData?.visit_purpose || 'Account Registration & Entry Verification';
        const authLocation = registeredData?.buildingLocation || registeredData?.location || registeredData?.meeting_location || '-';
        const authDate = registeredData?.expectedDate || registeredData?.appointmentDate || new Date().toISOString().split('T')[0];
        const authVerification = registeredData?.verificationStatus || registeredData?.verification_status || registeredData?.id_verification_status || 'Pending Verification';
        const authDocs = registeredData?.documents || [];
        try {
            const res = await visitorPortalApi.getHistory();
            const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.history || res.data?.records || []);
            if (rawData && Array.isArray(rawData) && rawData.length > 0) {
                const myRawData = rawData.filter((item) => {
                    if (!authEmail && !authName)
                        return true;
                    const itemEmail = (item.visitor_email || item.email || '').toLowerCase();
                    const itemName = (item.visitor_name || item.visitor || '').toLowerCase();
                    if (authEmail && itemEmail && itemEmail === authEmail.toLowerCase())
                        return true;
                    if (authName && itemName && itemName === authName.toLowerCase())
                        return true;
                    if (item.reference_number && registeredData?.referenceNumber && item.reference_number === registeredData.referenceNumber)
                        return true;
                    if (!itemEmail && !itemName)
                        return true;
                    return false;
                });
                const fetched = myRawData.map((item, idx) => {
                    let visitorName = item.visitor_name || item.visitor || authName;
                    let email = item.visitor_email || item.email || authEmail;
                    let phone = item.visitor_phone || item.phone || authPhone;
                    const rawComp = item.visitor_company || item.company || authCompany;
                    const company = (!rawComp || rawComp === '-' || ['information national', 'red cloud', 'africom', 'vms enterprise'].some(x => rawComp.toLowerCase().includes(x))) ? 'IT Park' : rawComp;
                    const category = item.visitor_category || item.category || authCategory;
                    const identityType = item.identity_type || item.identityType || authIdType;
                    const identityNumber = item.identity_number || item.identityNumber || authIdNum;
                    const rawPhoto = item.photo_url || item.visitor_photo || item.photoUrl || authPhoto;
                    const photoUrl = resolvePhotoUrl(rawPhoto);
                    const hostName = item.hostName || item.host_employee_name || item.host || authHost;
                    const department = item.departmentName || item.department_name || item.department || authDept;
                    const purpose = item.purpose || item.visit_purpose || authPurpose;
                    const location = item.roomName || item.meeting_location || item.location || authLocation;
                    const verificationStatus = item.verificationStatus || item.verification_status || authVerification;
                    // Determine whether an actual checkout has occurred
                    const rawCheckOut = item.exitTime || item.checkout_time || item.checkOutTime;
                    const rawCheckIn = item.entryTime || item.checkin_time || item.checkInTime;
                    const hasCheckedOut = !!rawCheckOut &&
                        rawCheckOut !== '-' &&
                        String(rawCheckOut).trim() !== '' &&
                        String(rawCheckOut) !== String(rawCheckIn);
                    const rawStat = (item.approval_status || item.appointment_status || item.appointmentStatus || item.visit_status || item.status || 'PENDING').toString().toUpperCase();
                    let status = 'PENDING';
                    if (rawStat.includes('CANCEL')) {
                        status = 'CANCELLED';
                    }
                    else if (rawStat.includes('RESCHED')) {
                        status = 'RESCHEDULED';
                    }
                    else if (rawStat.includes('REJECT') || rawStat.includes('DECLIN')) {
                        status = 'REJECTED';
                    }
                    else if (hasCheckedOut || ['COMPLETED', 'CHECKED_OUT', 'CHECKOUT'].some(s => rawStat.includes(s))) {
                        status = 'COMPLETED';
                    }
                    else if (rawStat.includes('CHECKED_IN') || rawStat.includes('CHECKIN') || rawStat === 'IN_PROGRESS') {
                        status = 'CHECKED IN';
                    }
                    else if (['APPROVED', 'CONFIRMED'].includes(rawStat)) {
                        status = 'APPROVED';
                    }
                    else {
                        status = 'PENDING';
                    }
                    const checkInTime = rawCheckIn && rawCheckIn !== '-'
                        ? (!isNaN(Date.parse(rawCheckIn)) ? new Date(rawCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : String(rawCheckIn))
                        : (registeredData?.checkInTime && registeredData?.checkInTime !== '-' ? registeredData.checkInTime : '-');
                    const checkOutTime = hasCheckedOut
                        ? (!isNaN(Date.parse(rawCheckOut)) ? new Date(rawCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : String(rawCheckOut))
                        : '-';

                    // Compute real duration from check-in/out timestamps or requested appointment duration
                    let realDuration = 0;
                    if (rawCheckIn && rawCheckOut && rawCheckIn !== '-' && rawCheckOut !== '-' && String(rawCheckIn).trim() !== String(rawCheckOut).trim()) {
                        const dIn = new Date(rawCheckIn);
                        const dOut = new Date(rawCheckOut);
                        if (!isNaN(dIn.getTime()) && !isNaN(dOut.getTime()) && dOut >= dIn) {
                            realDuration = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / 60000));
                        }
                    } else if (rawCheckIn && rawCheckIn !== '-' && (!rawCheckOut || rawCheckOut === '-')) {
                        const dIn = new Date(rawCheckIn);
                        if (!isNaN(dIn.getTime())) {
                            realDuration = Math.max(1, Math.round((Date.now() - dIn.getTime()) / 60000));
                        }
                    }

                    let reqDuration = item.expected_duration_minutes || item.expectedDurationMinutes || item.durationMinutes || item.visit_duration_minutes || item.duration;
                    const sStart = item.scheduledStart || item.scheduled_start;
                    const sEnd = item.scheduledEnd || item.scheduled_end;
                    if (!reqDuration && sStart && sEnd) {
                        const d1 = new Date(sStart);
                        const d2 = new Date(sEnd);
                        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
                            reqDuration = Math.max(15, Math.round((d2.getTime() - d1.getTime()) / 60000));
                        }
                    }
                    if (!reqDuration) reqDuration = 60;

                    const duration = realDuration > 0 ? realDuration : reqDuration;
                    return {
                        id: String(item.id || item.appointmentId || `VIS-${idx + 100}`),
                        historyCode: item.history_code || item.historyCode || `VIS-2026-${String(idx + 1).padStart(6, '0')}`,
                        referenceNumber: item.reference_number || item.referenceCode || item.referenceNumber || registeredData?.referenceNumber || `REF-REG-2026-${String(idx + 1).padStart(3, '0')}`,
                        visitorName,
                        company,
                        identityNumber,
                        identityType,
                        category,
                        hostName,
                        department,
                        appointmentNumber: item.appointment_number || item.appointmentNumber || userFromStorage?.visitor_id || userFromStorage?.userCode || `VISIT${String(idx + 1).padStart(6, '0')}`,
                        purpose,
                        checkInTime,
                        checkOutTime,
                        duration,
                        status,
                        scheduled_start: item.scheduledStart || item.scheduled_start || item.completed_date || authDate,
                        email,
                        phone,
                        location,
                        branch: item.branchName || item.branch_name || item.branch || 'Main HQ',
                        passNumber: item.passNumber || item.pass_number || `VP-2026-${String(idx + 1).padStart(4, '0')}`,
                        verificationStatus,
                        photoUrl,
                        documents: item.documents || authDocs
                    };
                });
                // Ensure exactly 1 unified history record per visitor: prefer updated appointment record if present
                if (fetched.length > 1) {
                    const apptRecord = fetched.find((r) => r.hostName && r.hostName !== 'Security Desk' && r.hostName !== '-');
                    records = [apptRecord || fetched[0]];
                }
                else {
                    records = fetched;
                }
                try {
                    localStorage.removeItem('vms_history_appointments');
                }
                catch (e) { }
            }
        }
        catch (e) {
            console.warn('Failed to load API history records:', e);
        }
        // Check local storage history items for current user
        try {
            const localHist = JSON.parse(localStorage.getItem('vms_history_appointments') || '[]');
            if (Array.isArray(localHist) && localHist.length > 0) {
                const userHist = localHist.filter((h) => {
                    const hEmail = (h.email || h.visitorEmail || h.visitor_email || '').toLowerCase();
                    return !hEmail || !authEmail || hEmail === authEmail;
                }).map((h) => ({
                    id: h.id || `HIST-${Date.now()}`,
                    historyCode: h.historyCode || h.referenceCode || `VIS-2026-${String(userFromStorage?.id || 1).padStart(4, '0')}`,
                    referenceNumber: h.referenceNumber || h.referenceCode || `REF-REG-2026-${String(userFromStorage?.id || 1).padStart(3, '0')}`,
                    visitorName: h.visitorName || authName,
                    company: (!h.company || h.company === '-' || ['information national', 'red cloud', 'africom', 'vms enterprise'].some(x => h.company.toLowerCase().includes(x))) ? (authCompany || 'IT Park') : h.company,
                    identityNumber: h.identityNumber || authIdNum || 'Not provided',
                    identityType: h.identityType || authIdType || 'National ID',
                    category: h.category || 'Business Visitor',
                    hostName: h.hostName || h.host || '-',
                    department: h.department || h.hostDepartment || '-',
                    appointmentNumber: h.appointmentNumber || h.id || '-',
                    purpose: h.purpose || h.title || 'Business Visit',
                    checkInTime: h.check_in_time || h.checkInTime || '-',
                    checkOutTime: h.check_out_time || h.checkOutTime || '-',
                    duration: h.duration || 0,
                    status: (h.status || 'PENDING').toUpperCase(),
                    scheduled_start: h.scheduled_start || authDate,
                    email: h.email || authEmail,
                    phone: h.phone || authPhone,
                    location: h.location || '-',
                    branch: h.branch || 'Main HQ',
                    passNumber: h.passNumber || `VP-2026-${String(userFromStorage?.id || 1).padStart(4, '0')}`,
                    verificationStatus: h.verificationStatus || authVerification,
                    photoUrl: authPhoto,
                    documents: authDocs
                }));
                if (userHist.length > 0) {
                    records = [...userHist, ...records];
                }
            }
        }
        catch (e) { }
        // If 0 history records found, generate initial Visitor Registration record for the logged-in visitor profile
        if (records.length === 0) {
            const currentUserId = userFromStorage?.id || 1;
            records = [{
                    id: registeredData?.id || `VIS-2026-${String(currentUserId).padStart(4, '0')}`,
                    historyCode: registeredData?.historyCode || `VIS-2026-${String(currentUserId).padStart(4, '0')}`,
                    referenceNumber: registeredData?.referenceNumber || `REF-REG-2026-${String(currentUserId).padStart(3, '0')}`,
                    visitorName: authName,
                    company: (!authCompany || authCompany === '-' || ['information national', 'red cloud', 'africom', 'vms enterprise'].some(x => authCompany.toLowerCase().includes(x))) ? 'IT Park' : authCompany,
                    identityNumber: authIdNum || 'Not provided',
                    identityType: authIdType || 'National ID',
                    category: authCategory || 'General Visitor',
                    hostName: registeredData?.hostName || '-',
                    department: registeredData?.department || '-',
                    appointmentNumber: '-',
                    purpose: 'Account Registration & Entry Verification',
                    checkInTime: '-',
                    checkOutTime: '-',
                    duration: 0,
                    status: 'PENDING',
                    scheduled_start: authDate,
                    email: authEmail,
                    phone: authPhone || '-',
                    location: '-',
                    branch: 'Main HQ',
                    passNumber: `VP-2026-${String(currentUserId).padStart(4, '0')}`,
                    verificationStatus: authVerification || 'Pending Verification',
                    photoUrl: authPhoto,
                    documents: authDocs
                }];
        }
        // Apply uploaded photo to all records for this visitor if available
        try {
            const activeProfile = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            let effectivePhoto = authPhoto;
            if (activeProfile) {
                const parsed = JSON.parse(activeProfile);
                const pEmail = (parsed.email || '').toLowerCase().trim();
                if (!pEmail || !currentEmail || pEmail === currentEmail) {
                    const ph = parsed.photo_url || parsed.photoUrl || parsed.avatarUrl || parsed.photo || parsed.visitorPhoto;
                    if (ph && isValidImageUrl(ph))
                        effectivePhoto = ph;
                }
            }
            if (effectivePhoto) {
                const resolved = resolvePhotoUrl(effectivePhoto);
                records = records.map((r) => ({
                    ...r,
                    photoUrl: resolved
                }));
            }
        }
        catch (e) { }
        setHistory(records);
        setLoading(false);
    }, []);
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    useEffect(() => {
        const handleStorageUpdate = () => {
            fetchHistory();
        };
        window.addEventListener('storage', handleStorageUpdate);
        window.addEventListener('user_updated', handleStorageUpdate);
        window.addEventListener('appointment_status_changed', handleStorageUpdate);
        window.addEventListener('appointment_updated', handleStorageUpdate);
        return () => {
            window.removeEventListener('storage', handleStorageUpdate);
            window.removeEventListener('user_updated', handleStorageUpdate);
            window.removeEventListener('appointment_status_changed', handleStorageUpdate);
            window.removeEventListener('appointment_updated', handleStorageUpdate);
        };
    }, [fetchHistory]);
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };
    // Sorted Records
    const sortedRecords = [...history].sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB)
            return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB)
            return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 inline-block ${sortBy === column ? 'text-blue-500' : 'text-slate-400'}`}/>);
    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s.includes('CANCEL')) {
            return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
        }
        if (s.includes('RESCHED')) {
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
        }
        if (s.includes('REJECT') || s.includes('DECLIN')) {
            return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
        }
        if (s === 'COMPLETED' || s.includes('CHECKED_OUT') || s.includes('CHECKOUT')) {
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
        }
        if (s.includes('CHECKED_IN') || s.includes('CHECKIN') || s === 'CHECKED IN') {
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        }
        if (s === 'APPROVED' || s === 'CONFIRMED') {
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        }
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    };
    const handleViewDetails = (item) => {
        setSelectedAppt(item);
    };
    const handleViewPass = (item) => {
        const passData = {
            visitorName: item.visitorName,
            visitorPhoto: item.photoUrl || '',
            visitorId: item.appointmentNumber || item.id,
            referenceNo: item.referenceNumber,
            visitorCategory: item.category || 'General Visitor',
            appointmentTitle: item.purpose || '',
            appointmentId: item.appointmentNumber || '',
            hostName: item.hostName || '',
            hostDepartment: item.department || '',
            location: item.location || '',
            date: item.scheduled_start ? new Date(item.scheduled_start).toLocaleDateString() : '',
            time: `${item.checkInTime || ''} - ${item.checkOutTime || ''}`,
            accessPoint: 'Main Gate / Reception',
            status: item.status ? item.status.toUpperCase() : 'PENDING',
            email: item.email || '',
            phone: item.phone || '',
            company: item.company || '',
            branch: item.branch || 'Main HQ',
            identityType: item.identityType || '',
            identityNumber: item.identityNumber || '',
            passNumber: item.passNumber || '',
            registeredOn: item.scheduled_start ? new Date(item.scheduled_start).toLocaleDateString() : '',
            verificationStatus: item.verificationStatus || 'Pending Verification'
        };
        try {
            sessionStorage.setItem('active_visitor_pass', JSON.stringify(passData));
        }
        catch (e) { }
        setSearchParams({ view: 'visitor_pass', id: String(item.id) });
    };
    const handleViewProfile = (item) => {
        const profileData = {
            id: item.id,
            visitor_code: item.historyCode,
            reference_number: item.referenceNumber,
            full_name: item.visitorName,
            first_name: item.visitorName.split(' ')[0] || item.visitorName,
            middle_name: item.visitorName.split(' ')[1] || '',
            last_name: item.visitorName.split(' ').slice(2).join(' ') || item.visitorName.split(' ')[1] || '',
            email: item.email || '',
            phone: item.phone || '',
            company: item.company || '',
            category: item.category || '',
            id_type: item.identityType || '',
            id_number: item.identityNumber || '',
            department_name: item.department || '',
            branch_name: item.branch || '',
            meeting_location: item.location || '',
            pass_number: item.passNumber || '',
            status: item.status || 'PENDING',
            id_verification_status: item.verificationStatus || 'Pending Verification',
            photo_url: item.photoUrl || '',
            documents: item.documents || []
        };
        try {
            sessionStorage.setItem('active_visitor_profile', JSON.stringify(profileData));
        }
        catch (e) { }
        setSearchParams({ view: 'visitor_profile', id: String(item.id), code: item.historyCode });
    };
    const handleConfirmDelete = async () => {
        if (!deleteItem)
            return;
        setIsDeleting(true);
        try {
            if (deleteItem.id) {
                try {
                    await visitorHistoryApi.delete(deleteItem.id);
                }
                catch (apiErr) {
                    console.warn('[VisitHistory] Backend delete warning:', apiErr);
                }
            }
            setHistory((prev) => prev.filter((item) => item.id !== deleteItem.id));
            setToast({
                message: `Visit history record #${deleteItem.historyCode || deleteItem.id} deleted successfully.`,
                type: 'success',
            });
            setDeleteItem(null);
        }
        catch (err) {
            setToast({
                message: err.message || 'Failed to delete visit history record.',
                type: 'danger',
            });
        }
        finally {
            setIsDeleting(false);
        }
    };
    return (<div className="space-y-4">
      {/* Details Overlay Modal */}
      {selectedAppt && (<AppointmentDetailsModal appointment={selectedAppt} onClose={() => setSelectedAppt(null)} onEdit={(appt) => {
                setSelectedAppt(null);
                setEditingAppt(appt);
            }}/>)}

      {/* Edit Overlay Modal */}
      {editingAppt && (<EditAppointmentModal appointment={editingAppt} onClose={() => setEditingAppt(null)} onSave={(updated) => {
                setHistory((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
            }}/>)}

      {/* Extended Profile Info Modal */}
      <AddOtherVisitorInfoModal isOpen={isAddInfoModalOpen} initialData={{
            photoUrl: history[0]?.photoUrl,
            photo_url: history[0]?.photoUrl,
            identityType: history[0]?.identityType,
            identityNumber: history[0]?.identityNumber
        }} onClose={() => setIsAddInfoModalOpen(false)} onSuccess={() => fetchHistory()}/>

      {/* Header — Visitor's Personal History Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('visitHistory.title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold">
              {t('visitHistory.subtitle')}
            </p>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => setIsAddInfoModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer no-print">
            <Plus className="h-4 w-4"/> {t('visitHistory.addUpdateProfile')}
          </button>
          <button onClick={fetchHistory} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RefreshCw className="h-3.5 w-3.5"/> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Main Table Container — Horizontal Column Layout with whitespace-nowrap */}
      <div className="table-responsive">
        <table className="table align-middle text-xs mb-0">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold whitespace-nowrap">
              <th className="px-3 py-3 text-center" style={{ width: 50 }}>
                {t('table.visitor')}
              </th>
              <th className="px-3 py-3 cursor-pointer whitespace-nowrap" onClick={() => handleSort('historyCode')}>
                {t('visitHistory.visitorIdRef')} {renderSortIcon('historyCode')}
              </th>
              <th className="px-3 py-3 cursor-pointer whitespace-nowrap" onClick={() => handleSort('visitorName')}>
                {t('visitHistory.visitorNameId')} {renderSortIcon('visitorName')}
              </th>
              <th className="px-3 py-3 whitespace-nowrap">
                {t('visitHistory.contactInfo')}
              </th>
              <th className="px-3 py-3 cursor-pointer whitespace-nowrap" onClick={() => handleSort('category')}>
                {t('table.category')} {renderSortIcon('category')}
              </th>
              <th className="px-3 py-3 cursor-pointer whitespace-nowrap" onClick={() => handleSort('hostName')}>
                {t('visitHistory.hostDept')} {renderSortIcon('hostName')}
              </th>
              <th className="px-3 py-3 whitespace-nowrap">
                {t('visitHistory.apptPurpose')}
              </th>
              <th className="px-3 py-3 whitespace-nowrap">
                {t('visitHistory.locationPass')}
              </th>
              <th className="px-3 py-3 cursor-pointer whitespace-nowrap" onClick={() => handleSort('checkInTime')}>
                {t('visitHistory.checkInOut')} {renderSortIcon('checkInTime')}
              </th>
              <th className="px-3 py-3 cursor-pointer text-center whitespace-nowrap" onClick={() => handleSort('duration')}>
                {t('table.duration')} {renderSortIcon('duration')}
              </th>
              <th className="px-3 py-3 cursor-pointer text-center whitespace-nowrap" onClick={() => handleSort('status')}>
                {t('table.status')} {renderSortIcon('status')}
              </th>
              <th className="px-3 py-3 text-end whitespace-nowrap">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (<tr>
                <td colSpan={12} className="text-center py-5">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto"/>
                </td>
              </tr>) : sortedRecords.length > 0 ? (sortedRecords.map((item) => (<tr key={item.id} className="border-bottom border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  {/* Visitor Avatar */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    {isValidImageUrl(item.photoUrl) ? (<img src={resolvePhotoUrl(item.photoUrl)} alt={item.visitorName} className="h-8 w-8 rounded-full object-cover border border-slate-700/80 mx-auto shadow-sm" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback)
                        fallback.style.display = 'flex';
                }}/>) : null}
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white border border-indigo-500/50 d-flex align-items-center justify-content-center mx-auto" style={{
                display: isValidImageUrl(item.photoUrl) ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                      <span className="font-black text-[10px] tracking-wider">{getInitials(item.visitorName)}</span>
                    </div>
                  </td>

                  {/* Visitor ID & Reference Code */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold d-inline-block mb-0.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                      {item.historyCode}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {item.referenceNumber}
                    </div>
                  </td>

                  {/* Visitor Name / Identity */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="fw-bold text-white text-xs d-block whitespace-nowrap">{item.visitorName}</span>
                    <div className="text-[10px] text-slate-400 fw-semibold whitespace-nowrap">{item.company}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 d-flex align-items-center gap-1 whitespace-nowrap">
                      <CreditCard className="h-3 w-3 text-slate-500 shrink-0"/>
                      <span>{item.identityNumber} ({item.identityType})</span>
                    </div>
                  </td>

                  {/* Contact Info (Email & Phone) */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {item.email && (<div className="text-[10px] text-slate-400 fw-semibold d-flex align-items-center gap-1 mb-0.5 whitespace-nowrap">
                        <Mail className="h-3 w-3 text-slate-500 shrink-0"/>
                        <span>{item.email}</span>
                      </div>)}
                    {item.phone && (<div className="text-[10px] text-slate-400 fw-semibold d-flex align-items-center gap-1 whitespace-nowrap">
                        <Phone className="h-3 w-3 text-slate-500 shrink-0"/>
                        <span>{item.phone}</span>
                      </div>)}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="badge bg-slate-800 text-slate-300 text-[10px] fw-bold px-2.5 py-1 rounded border border-slate-700/80 whitespace-nowrap">
                      {item.category}
                    </span>
                  </td>

                  {/* Host & Dept */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="fw-bold text-white text-xs whitespace-nowrap">{item.hostName}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 fw-semibold mt-0.5 whitespace-nowrap">{item.department}</div>
                  </td>

                  {/* Appointment & Purpose */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-mono text-[10px] text-slate-400 fw-bold whitespace-nowrap">{item.appointmentNumber}</div>
                    <span className="d-block text-slate-300 fw-medium mt-0.5 text-[11px] whitespace-nowrap">
                      {item.purpose}
                    </span>
                  </td>

                  {/* Location & Pass */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {item.location && (<div className="text-[10px] text-slate-400 fw-semibold d-flex align-items-center gap-1 mb-0.5 whitespace-nowrap">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0"/>
                        <span>{item.location}</span>
                      </div>)}
                    {item.branch && (<div className="text-[10px] text-slate-400 fw-semibold d-flex align-items-center gap-1 mb-0.5 whitespace-nowrap">
                        <Building2 className="h-3 w-3 text-slate-500 shrink-0"/>
                        <span>{item.branch}</span>
                      </div>)}
                    {item.passNumber && (<div className="font-mono text-[10px] text-amber-600 dark:text-amber-400 fw-bold whitespace-nowrap">
                        Pass: {item.passNumber}
                      </div>)}
                  </td>

                  {/* Check-In / Out */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="d-flex align-items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] fw-bold whitespace-nowrap">
                      <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0"/>
                      <span>In: {item.checkInTime}</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px] mt-0.5 whitespace-nowrap">
                      Out: {item.checkOutTime}
                    </div>
                    {item.verificationStatus && (<div className="text-[9px] text-emerald-600 dark:text-emerald-400 fw-bold mt-0.5 text-uppercase whitespace-nowrap">
                        ✓ {item.verificationStatus}
                      </div>)}
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <span className="badge bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 fw-bold px-2 py-0.5 text-[10px] rounded-pill whitespace-nowrap">
                      {item.duration > 0 ? `${item.duration} min` : '-'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(item.status)} text-[9px] px-2.5 py-1 rounded-pill fw-bold text-uppercase tracking-wider whitespace-nowrap`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-3 py-2.5 text-end whitespace-nowrap">
                    <div className="d-flex align-items-center justify-content-end gap-1 flex-nowrap">
                      <button onClick={() => handleViewDetails(item)} className="btn btn-sm btn-outline-secondary p-1.5" title={t('visitHistory.viewDetails')}>
                        <Eye className="h-3.5 w-3.5"/>
                      </button>
                      <button onClick={() => {
                try {
                    sessionStorage.setItem('visitor_documents_source', JSON.stringify(item.documents || []));
                }
                catch (e) { }
                setSearchParams({ view: 'visitor_documents', id: String(item.id) });
            }} className="btn btn-sm btn-outline-secondary p-1.5" title={t('visitHistory.viewDocuments')}>
                        <FileText className="h-3.5 w-3.5"/>
                      </button>
                      <button onClick={() => handleViewProfile(item)} className="btn btn-sm btn-outline-secondary p-1.5" title={t('visitHistory.viewProfile')}>
                        <User className="h-3.5 w-3.5"/>
                      </button>
                      <button onClick={() => {
                setSelectedAppt(null);
                setEditingAppt(item);
            }} className="btn btn-sm btn-outline-secondary p-1.5" title={t('visitHistory.editRecord')}>
                        <Edit3 className="h-3.5 w-3.5"/>
                      </button>
                      <button onClick={() => handleViewPass(item)} className="btn btn-sm btn-outline-secondary p-1.5" title={t('visitHistory.viewDigitalPass')}>
                        <QrCode className="h-3.5 w-3.5"/>
                      </button>
                      <button onClick={() => setDeleteItem(item)} className="btn btn-sm btn-outline-danger p-1.5 hover:bg-rose-600 hover:text-white transition-all" title={t('visitHistory.deleteRecord')}>
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>))) : (<tr>
                <td colSpan={12} className="text-center py-5 text-slate-500 fw-bold text-uppercase text-xs whitespace-nowrap">
                  {t('visitHistory.noRecords')}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteItem && (<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="h-6 w-6"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Visit History Record</h3>
                <p className="text-xs text-slate-400">This action will remove the record from your history ledger.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor:</span>
                <span className="font-bold text-white">{deleteItem.visitorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono text-indigo-400 font-bold">{deleteItem.historyCode || deleteItem.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purpose:</span>
                <span className="text-slate-300 font-medium">{deleteItem.purpose || 'General Visit'}</span>
              </div>
              {deleteItem.checkInTime && (<div className="flex justify-between">
                  <span className="text-slate-400">Check-in:</span>
                  <span className="text-emerald-400 font-mono">{deleteItem.checkInTime}</span>
                </div>)}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDeleteItem(null)} disabled={isDeleting} className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDelete} disabled={isDeleting} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer">
                {isDeleting ? (<>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    <span>Deleting...</span>
                  </>) : (<>
                    <Trash2 className="h-3.5 w-3.5"/>
                    <span>Confirm Delete</span>
                  </>)}
              </button>
            </div>
          </div>
        </div>)}

      {/* Action Toast Notifications */}
      {toast && (<div className="fixed bottom-6 right-6 z-[99999]">
          <div className={`flex items-start gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl min-w-[320px] max-w-md ${toast.type === 'danger'
                ? 'bg-rose-950/95 border-rose-800 text-rose-200'
                : 'bg-emerald-950/95 border-emerald-800 text-emerald-200'}`}>
            <span className="text-sm">
              {toast.type === 'danger' ? '⚠️' : '✓'}
            </span>
            <div className="flex-1 text-xs font-medium">
              {toast.message}
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white text-xs font-bold ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        </div>)}
    </div>);
}
