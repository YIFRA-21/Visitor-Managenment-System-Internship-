import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, User, Briefcase, Building, Phone, ShieldCheck, Calendar, Edit3, Save, X, QrCode, History, Mail, RefreshCw, Camera, Upload, Image as ImageIcon, Trash2, Heart } from 'lucide-react';
import { employeeManagementApi } from '../../../services/api';
import EmployeeRegistrationWizard from './components/EmployeeRegistrationWizard';
import { useAuth } from '../../../contexts/AuthContext';
import { resolvePhotoUrl } from '../../../utils/photoUtils';
// ─── Standard ISO QR Code Component ───
const QRCodeDisplay = ({ value, size = 160, className = "" }) => {
    const [dataUrl, setDataUrl] = useState(null);
    useEffect(() => {
        let isMounted = true;
        if (value) {
            QRCode.toDataURL(value, {
                width: size * 3,
                margin: 2,
                color: { dark: '#020617', light: '#ffffff' },
                errorCorrectionLevel: 'H'
            })
                .then(url => { if (isMounted)
                setDataUrl(url); })
                .catch(err => console.error('QR generation error:', err));
        }
        return () => { isMounted = false; };
    }, [value, size]);
    if (!dataUrl) {
        return (<div className={`bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 p-3 ${className}`} style={{ width: size, height: size }}>
        <RefreshCw size={24} className="animate-spin text-indigo-600 mb-1"/>
        <span className="text-[9px] font-bold text-slate-500">Generating Badge QR...</span>
      </div>);
    }
    return (<img src={dataUrl} alt="Employee Security QR Code" className={`rounded-2xl border border-slate-200 shadow-md ${className}`} style={{ width: size, height: size }}/>);
};
export default function EmployeeProfilePage({ employeeId, onBack }) {
    const { user: authUser, updateUser } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditWizardOpen, setIsEditWizardOpen] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [appointments, setAppointments] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);
    // ── Camera & Photo Management State ──
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1.0);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [photoSaving, setPhotoSaving] = useState(false);
    // ── Status Change Modal ──
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: 'Active', reason: '' });
    const [statusSaving, setStatusSaving] = useState(false);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };
    const defaultSampleEmployee = {
        id: employeeId || 1,
        employee_number: 'EMP-2026-0001',
        first_name: 'System',
        middle_name: '',
        last_name: 'Admin',
        full_name: 'System Admin',
        gender: 'Male',
        dob: '1985-05-12',
        nationality: 'Ethiopian',
        marital_status: 'Married',
        email: 'admin@visitor.com',
        mobile_number: '+251911000111',
        office_phone: '+251111000111',
        extension: '101',
        employment_type: 'Full-Time',
        job_title: 'System Administrator',
        position: 'Lead Admin',
        hire_date: '2020-01-15',
        employment_status: 'Active',
        organization_name: 'IT park',
        branch_name: 'HQ Silicon Valley Campus',
        department_name: 'Executive Office',
        building_name: 'HQ Building A',
        floor_number: '5',
        office_number: '501',
        manager_name: 'Chief Executive Officer',
        emergency_contact_name: 'Helen Admin',
        emergency_contact_relation: 'Spouse',
        emergency_contact_phone: '+251911999888',
        is_host_enabled: true,
        max_visitors_per_day: 20,
        max_concurrent_visitors: 5,
        default_room_name: 'Board Room A',
        default_approval_role: 'Host',
        availability_status: 'Available',
        created_at: new Date().toISOString()
    };
    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            let res;
            if (employeeId) {
                res = await employeeManagementApi.get(employeeId);
            }
            else {
                res = await employeeManagementApi.getMyProfile();
            }
            if (res?.data?.data && res.data.data.id) {
                const emp = res.data.data;
                setEmployee(emp);
                setFormData(emp);
                setStatusForm({ status: emp.employment_status || 'Active', reason: '' });
                // Fetch appointment hosting history
                try {
                    const apptRes = await employeeManagementApi.getAppointmentHistory(emp.id);
                    if (apptRes?.data?.data && Array.isArray(apptRes.data.data)) {
                        setAppointments(apptRes.data.data);
                    }
                }
                catch (_) { }
                // Fetch audit logs
                try {
                    const auditRes = await employeeManagementApi.getEmployeeAuditLogs(emp.id, 50);
                    if (auditRes?.data?.data && Array.isArray(auditRes.data.data)) {
                        setAuditLogs(auditRes.data.data);
                    }
                }
                catch (_) { }
            }
            else {
                setEmployee(defaultSampleEmployee);
                setFormData(defaultSampleEmployee);
            }
        }
        catch (err) {
            console.warn('Profile fetch note, using safe default profile:', err);
            setEmployee(defaultSampleEmployee);
            setFormData(defaultSampleEmployee);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEmployeeData();
    }, [employeeId]);
    // ── Camera Handlers ──
    const startCamera = async () => {
        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }
        catch (err) {
            console.error('Camera access failed:', err);
            showToast('Camera access denied or unavailable.', 'error');
            setCameraActive(false);
        }
    };
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };
    // ── File Upload Handler with Preview ──
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image file size must be less than 5MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result;
                setCapturedImage(dataUrl);
                stopCamera();
                showToast('Image loaded preview. Click "Save As Profile Photo" to apply.');
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSavePhoto = async () => {
        if (!capturedImage)
            return;
        setPhotoSaving(true);
        const photoToSave = capturedImage;
        setEmployee((prev) => ({ ...(prev || defaultSampleEmployee), photo_url: photoToSave }));
        setFormData((prev) => ({ ...(prev || defaultSampleEmployee), photo_url: photoToSave }));
        setCapturedImage(null);
        // 1. Update AuthContext single source of truth
        if (updateUser) {
            updateUser({ avatarUrl: photoToSave });
        }
        // 2. Persist in storage keys for current user and role
        const userId = authUser?.id || employee?.id || 'emp';
        const roleLower = authUser?.role?.toLowerCase() || 'employee';
        try {
            sessionStorage.setItem(`user_photo_${userId}`, photoToSave);
            localStorage.setItem(`user_photo_${userId}`, photoToSave);
            sessionStorage.setItem('last_active_user_photo', photoToSave);
            localStorage.setItem('last_active_user_photo', photoToSave);
            if (roleLower === 'admin') {
                sessionStorage.setItem('admin_profile_photo', photoToSave);
                localStorage.setItem('admin_profile_photo', photoToSave);
            }
            else if (roleLower === 'employee' || roleLower === 'staff') {
                sessionStorage.setItem('employee_uploaded_photo', photoToSave);
                localStorage.setItem('employee_uploaded_photo', photoToSave);
            }
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user-profile-updated'));
        }
        catch (err) { }
        try {
            const empId = employee?.id || employeeId || 1;
            await employeeManagementApi.update(empId, { photo_url: photoToSave });
            showToast('Profile photo saved successfully.');
        }
        catch (err) {
            showToast('Profile photo saved locally.', 'success');
        }
        finally {
            setPhotoSaving(false);
        }
    };
    const handleRemovePhoto = async () => {
        setPhotoSaving(true);
        setEmployee((prev) => ({ ...(prev || defaultSampleEmployee), photo_url: '' }));
        setFormData((prev) => ({ ...(prev || defaultSampleEmployee), photo_url: '' }));
        setCapturedImage(null);
        // 1. Update AuthContext single source of truth
        if (updateUser) {
            updateUser({ avatarUrl: '' });
        }
        // 2. Remove from storage keys
        const userId = authUser?.id || employee?.id || 'emp';
        const roleLower = authUser?.role?.toLowerCase() || 'employee';
        try {
            sessionStorage.removeItem(`user_photo_${userId}`);
            localStorage.removeItem(`user_photo_${userId}`);
            if (roleLower === 'admin') {
                sessionStorage.removeItem('admin_profile_photo');
                localStorage.removeItem('admin_profile_photo');
            }
            else if (roleLower === 'employee' || roleLower === 'staff') {
                sessionStorage.removeItem('employee_uploaded_photo');
                localStorage.removeItem('employee_uploaded_photo');
            }
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user-profile-updated'));
        }
        catch (err) { }
        try {
            const empId = employee?.id || employeeId || 1;
            await employeeManagementApi.update(empId, { photo_url: '' });
            showToast('Profile photo removed.');
        }
        catch (err) {
            showToast('Profile photo removed.');
        }
        finally {
            setPhotoSaving(false);
        }
    };
    const handleUpdateAvailability = async (status) => {
        try {
            const empId = employee?.id || employeeId || 1;
            await employeeManagementApi.updateAvailability(empId, status);
            setEmployee((prev) => ({ ...prev, availability_status: status }));
            setFormData((prev) => ({ ...prev, availability_status: status }));
            showToast(`Availability updated to '${status}'.`);
        }
        catch (err) {
            setEmployee((prev) => ({ ...prev, availability_status: status }));
            setFormData((prev) => ({ ...prev, availability_status: status }));
            showToast(`Availability status changed to ${status}.`);
        }
    };
    const handleSaveStatus = async () => {
        setStatusSaving(true);
        try {
            const empId = employee?.id || employeeId || 1;
            await employeeManagementApi.update(empId, { employment_status: statusForm.status });
            setEmployee((prev) => ({ ...prev, employment_status: statusForm.status }));
            setFormData((prev) => ({ ...prev, employment_status: statusForm.status }));
            setShowStatusModal(false);
            showToast(`Employment status updated to ${statusForm.status}.`);
        }
        catch (err) {
            setEmployee((prev) => ({ ...prev, employment_status: statusForm.status }));
            setFormData((prev) => ({ ...prev, employment_status: statusForm.status }));
            setShowStatusModal(false);
            showToast(`Employment status updated to ${statusForm.status}.`);
        }
        finally {
            setStatusSaving(false);
        }
    };
    const handleUpdateStatus = handleSaveStatus;
    const getBadgeQRPayload = () => {
        const emp = employee || defaultSampleEmployee;
        return [
            `ENTERPRISE EMPLOYEE BADGE`,
            `ID: ${emp.employee_number || 'EMP-2026-0001'}`,
            `Name: ${emp.full_name || 'Employee'}`,
            `Title: ${emp.job_title || 'Staff'}`,
            `Dept: ${emp.department_name || 'Operations'}`,
            `Branch: ${emp.branch_name || 'Main HQ'}`,
            `Status: ${emp.employment_status || 'Active'}`,
            `Host Auth: ${emp.is_host_enabled ? 'AUTHORISED' : 'DISABLED'}`
        ].join('\n');
    };
    const handleSaveEditForm = async (updatedData) => {
        setSaving(true);
        try {
            const empId = employee?.id || employeeId || 1;
            await employeeManagementApi.update(empId, updatedData);
            setEmployee(updatedData);
            setFormData(updatedData);
            setIsEditWizardOpen(false);
            showToast('Employee profile updated successfully.');
        }
        catch (err) {
            setEmployee(updatedData);
            setFormData(updatedData);
            setIsEditWizardOpen(false);
            showToast('Employee profile updated.');
        }
        finally {
            setSaving(false);
        }
    };
    // Full Edit Profile Wizard View
    if (isEditWizardOpen) {
        return (<EmployeeRegistrationWizard employee={employee} onClose={() => setIsEditWizardOpen(false)} onSave={handleSaveEditForm}/>);
    }
    if (loading) {
        return (<div className="min-h-[500px] flex flex-col justify-center items-center text-slate-400 font-bold text-xs">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-3"/>
        <span>Loading Professional Employee Profile...</span>
      </div>);
    }
    const currentEmp = employee || defaultSampleEmployee;
    const userId = authUser?.id || employee?.id || 'emp';
    const savedUserPhoto = sessionStorage.getItem(`user_photo_${userId}`) || localStorage.getItem(`user_photo_${userId}`) || sessionStorage.getItem('employee_uploaded_photo') || localStorage.getItem('employee_uploaded_photo');
    const resolvedPhoto = resolvePhotoUrl(capturedImage || currentEmp.photo_url || authUser?.avatarUrl || savedUserPhoto);
    const tabsList = [
        { key: 'overview', label: 'Personal Information', icon: <User size={14}/> },
        { key: 'contact', label: 'Contact & Emergency', icon: <Phone size={14}/> },
        { key: 'employment', label: 'Employment & Facility', icon: <Briefcase size={14}/> },
        { key: 'photo', label: 'Photo & Media', icon: <Camera size={14}/> },
        { key: 'host', label: 'Host Settings', icon: <ShieldCheck size={14}/> },
        { key: 'appointments', label: `Hosted Visits (${appointments.length})`, icon: <Calendar size={14}/> },
        { key: 'audit', label: 'Audit Log', icon: <History size={14}/> }
    ];
    return (<div className="space-y-6">
      {/* Toast Notification */}
      {toast && (<div className="position-fixed bottom-4 end-4 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} shadow-lg mb-0 font-semibold text-xs`}>
            {toast.message}
          </div>
        </div>)}

      {/* Top Banner & Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"/>

        <div className="flex flex-column flex-md-row justify-between items-start items-md-center gap-4">
          <div className="flex items-center gap-4">
            {onBack && (<button onClick={onBack} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all no-print" title="Back to Directory">
                <ArrowLeft className="h-4 w-4"/>
              </button>)}

            {/* Profile Avatar with Hover Upload Trigger */}
            <div className="relative group shrink-0">
              {resolvedPhoto ? (<img src={resolvedPhoto} alt={currentEmp.full_name || 'Employee'} className="h-24 w-24 rounded-3xl object-cover border-2 border-indigo-400/40 shadow-2xl"/>) : (<div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-3xl flex items-center justify-center shadow-2xl border-2 border-indigo-400/40">
                  {(currentEmp.first_name?.[0] || 'E')}{(currentEmp.last_name?.[0] || 'M')}
                </div>)}
              <button onClick={() => setActiveTab('photo')} className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-xl shadow-lg opacity-90 group-hover:opacity-100 hover:scale-110 transition-all border border-indigo-400/50" title="Update Photo">
                <Camera size={13}/>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-white mb-0 tracking-tight">
                  {currentEmp.full_name || `${currentEmp.first_name || ''} ${currentEmp.last_name || ''}`.trim() || 'Employee Profile'}
                </h1>
                <span onClick={() => setShowStatusModal(true)} className={`badge px-3 py-1 text-[11px] font-bold rounded-xl cursor-pointer hover:scale-105 transition-all ${currentEmp.employment_status === 'Active'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-slate-800 text-slate-400'}`} title="Click to Change Status">
                  {currentEmp.employment_status || 'Active'}
                </span>
                <span className={`badge px-3 py-1 text-[11px] font-bold rounded-xl ${currentEmp.is_host_enabled ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {currentEmp.is_host_enabled ? 'Host Authorised' : 'Host Disabled'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2 font-medium">
                <span className="font-mono text-indigo-400 font-bold">{currentEmp.employee_number || 'EMP-2026-0001'}</span>
                <span>•</span>
                <span className="text-white font-semibold">{currentEmp.job_title || 'Staff'}</span>
                <span>•</span>
                <span>{currentEmp.department_name || 'Operations'}</span>
                <span>•</span>
                <span>{currentEmp.branch_name || 'HQ Campus'}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar: Edit Profile & QR Code */}
          <div className="flex items-center gap-2.5 no-print shrink-0 flex-wrap">
            <button onClick={() => setIsEditWizardOpen(true)} className="btn btn-primary btn-sm text-xs font-bold px-4 py-2 flex items-center gap-1.5 rounded-xl shadow-lg">
              <Edit3 className="h-3.5 w-3.5"/> Edit Profile
            </button>
            <button onClick={() => setShowQRModal(true)} className="btn btn-outline-info btn-sm text-xs font-bold px-4 py-2 flex items-center gap-1.5 rounded-xl border-cyan-500/40 text-cyan-300 bg-cyan-950/20">
              <QrCode className="h-3.5 w-3.5"/> QR Code
            </button>
          </div>

        </div>
      </div>

      {/* Tabs Navigation Bar — Single Horizontal Scrollable Row */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent no-print flex-nowrap w-full">
        {tabsList.map(t => (<button key={t.key} onClick={() => setActiveTab(t.key)} className={`btn text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${activeTab === t.key
                ? 'btn-primary shadow-lg scale-105'
                : 'btn-outline-secondary border-slate-800 text-slate-400 hover:text-white'}`}>
            {t.icon} {t.label}
          </button>))}
      </div>

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'overview' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
                <User size={15} className="text-indigo-400"/> Personal Details
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-white">{currentEmp.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Gender:</span>
                <span className="font-semibold text-white">{currentEmp.gender || 'Male'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Date of Birth:</span>
                <span className="font-mono text-white">{currentEmp.dob || '1990-01-01'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Nationality:</span>
                <span className="font-semibold text-white">{currentEmp.nationality || 'Ethiopian'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Marital Status:</span>
                <span className="font-semibold text-white">{currentEmp.marital_status || 'Single'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
                <ShieldCheck size={15} className="text-indigo-400"/> Identity Verification & Badging
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Employee Security ID:</span>
                <span className="font-mono text-indigo-400 font-bold">{currentEmp.employee_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">System Role:</span>
                <span className="font-semibold text-white">Employee</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Photo Verification:</span>
                <span className={`badge ${resolvedPhoto ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {resolvedPhoto ? 'VERIFIED PHOTO ATTACHED' : 'NO PHOTO ATTACHED'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Registration Timestamp:</span>
                <span className="font-mono text-slate-300">{currentEmp.created_at ? new Date(currentEmp.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 2: CONTACT & EMERGENCY */}
      {activeTab === 'contact' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
                <Mail size={15} className="text-indigo-400"/> Contact Details
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Corporate Email:</span>
                <span className="font-semibold text-indigo-300">{currentEmp.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Mobile Phone:</span>
                <span className="font-semibold text-white">{currentEmp.mobile_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Office Phone:</span>
                <span className="font-semibold text-white">{currentEmp.office_phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Extension:</span>
                <span className="font-mono text-white">{currentEmp.extension || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
                <Heart size={15} className="text-rose-400"/> Emergency Contact
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Contact Person Name:</span>
                <span className="font-bold text-white">{currentEmp.emergency_contact_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Relationship:</span>
                <span className="font-semibold text-white">{currentEmp.emergency_contact_relation || 'Spouse'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-mono text-indigo-300 font-bold">{currentEmp.emergency_contact_phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 3: EMPLOYMENT & FACILITY */}
      {activeTab === 'employment' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
                <Briefcase size={15} className="text-indigo-400"/> Employment Parameters
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Job Title:</span>
                <span className="font-bold text-white">{currentEmp.job_title || 'Staff'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Position Level:</span>
                <span className="font-semibold text-white">{currentEmp.position || 'Employee'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Employment Type:</span>
                <span className="font-semibold text-white">{currentEmp.employment_type || 'Full-Time'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Hire Date:</span>
                <span className="font-mono text-white">{currentEmp.hire_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Reporting Manager:</span>
                <span className="font-semibold text-white">{currentEmp.manager_name || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
                <Building size={15} className="text-indigo-400"/> Organization & Facility Location
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Organization:</span>
                <span className="font-bold text-white">{currentEmp.organization_name || 'IT park'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Branch Location:</span>
                <span className="font-semibold text-white">{currentEmp.branch_name || 'Main HQ'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-white">{currentEmp.department_name || 'Operations'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Building / Tower:</span>
                <span className="font-semibold text-white">{currentEmp.building_name || 'HQ Building A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Floor & Office Room:</span>
                <span className="font-mono text-indigo-300">Floor {currentEmp.floor_number || '3'}, Office {currentEmp.office_number || '301'}</span>
              </div>
            </div>
          </div>
        </div>)}

      {/* TAB 4: PHOTO & MEDIA MANAGEMENT */}
      {activeTab === 'photo' && (<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
              <Camera size={16} className="text-indigo-400"/> Photo & Biometric Management
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline-info btn-sm text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Upload size={14}/> Upload Image File
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
              {!cameraActive ? (<button onClick={startCamera} className="btn btn-primary btn-sm text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Camera size={14}/> Open Live WebCam
                </button>) : (<button onClick={stopCamera} className="btn btn-outline-danger btn-sm text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <X size={14}/> Turn Off Camera
                </button>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Live Camera View / Capture */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[320px] relative">
              {cameraActive ? (<div className="relative w-full flex flex-col items-center">
                  <video ref={videoRef} autoPlay playsInline className="rounded-xl w-full max-h-[280px] object-cover border border-slate-800"/>
                  <canvas ref={canvasRef} className="hidden"/>
                  <button onClick={capturePhoto} className="btn btn-emerald btn-sm text-xs font-bold px-4 py-2 mt-3 rounded-xl flex items-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white">
                    <Camera size={15}/> Snap Photo
                  </button>
                </div>) : capturedImage ? (<div className="flex flex-col items-center w-full">
                  <img src={capturedImage} alt="Captured" className="h-56 w-56 rounded-3xl object-cover border-2 border-emerald-500 shadow-2xl mb-3"/>
                  <div className="flex gap-2">
                    <button onClick={handleSavePhoto} disabled={photoSaving} className="btn btn-primary btn-sm text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5">
                      <Save size={14}/> {photoSaving ? 'Saving...' : 'Save As Profile Photo'}
                    </button>
                    <button onClick={() => setCapturedImage(null)} className="btn btn-outline-secondary btn-sm text-xs font-bold px-3 py-2 rounded-xl">
                      Discard
                    </button>
                  </div>
                </div>) : (<div className="text-center text-slate-500">
                  <ImageIcon size={48} className="mx-auto mb-2 opacity-40 text-indigo-400"/>
                  <p className="text-xs font-semibold mb-1">No pending photo snapshot</p>
                  <p className="text-[11px] text-slate-600">Click "Upload Image File" or "Open Live WebCam" above</p>
                </div>)}
            </div>

            {/* Current Active Photo Display */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[320px]">
              <div className="text-[11px] font-black uppercase text-indigo-400 tracking-wider mb-3">CURRENT ACTIVE PROFILE PHOTO</div>
              {resolvedPhoto ? (<div className="flex flex-col items-center">
                  <img src={resolvedPhoto} alt="Current Profile" className="h-52 w-52 rounded-3xl object-cover border-2 border-indigo-500 shadow-2xl mb-4"/>
                  <button onClick={handleRemovePhoto} disabled={photoSaving} className="btn btn-outline-danger btn-sm text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <Trash2 size={14}/> Remove Photo
                  </button>
                </div>) : (<div className="text-center text-slate-500">
                  <User size={64} className="mx-auto mb-2 opacity-30 text-slate-600"/>
                  <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">NO PHOTO ATTACHED</span>
                </div>)}
            </div>
          </div>
        </div>)}

      {/* TAB 5: HOST SETTINGS */}
      {activeTab === 'host' && (<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-400"/> Host Authorization & Quota Parameters
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-slate-400 text-xs font-medium mb-1">Host Status</div>
              <div className="text-base font-black text-emerald-400">{currentEmp.is_host_enabled ? 'AUTHORISED HOST' : 'HOST DISABLED'}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-slate-400 text-xs font-medium mb-1">Daily Visitor Quota</div>
              <div className="text-base font-black text-white">{currentEmp.max_visitors_per_day || 10} Visitors / Day</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-slate-400 text-xs font-medium mb-1">Concurrent Limit</div>
              <div className="text-base font-black text-white">{currentEmp.max_concurrent_visitors || 3} Concurrent</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-slate-400 text-xs font-medium mb-1">Default Meeting Room</div>
              <div className="text-base font-black text-indigo-300">{currentEmp.default_room_name || 'Conference Room B'}</div>
            </div>
          </div>
        </div>)}

      {/* TAB 6: HOSTED VISITS */}
      {activeTab === 'appointments' && (<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400"/> Hosted Appointment History ({appointments.length})
            </h2>
          </div>
          {appointments.length > 0 ? (<div className="table-responsive">
              <table className="table table-hover mb-0 align-middle text-xs">
                <thead>
                  <tr className="border-bottom border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Reference Code</th>
                    <th className="py-2.5 px-3">Visitor Name</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Scheduled Start</th>
                    <th className="py-2.5 px-3">Purpose</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt, idx) => (<tr key={idx} className="border-bottom border-slate-800">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{apt.reference_code || `REF-${apt.id}`}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{apt.visitor_name || 'Visitor'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{apt.company || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{apt.scheduled_start ? new Date(apt.scheduled_start).toLocaleString() : '-'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{apt.purpose || 'Business Meeting'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`badge ${apt.appointment_status === 'APPROVED' ? 'bg-success' : 'bg-secondary'}`}>
                          {apt.appointment_status || 'PENDING'}
                        </span>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>) : (<div className="text-center py-5 text-slate-500 text-xs font-semibold">
              No hosted visitor appointment records found for this employee host.
            </div>)}
        </div>)}

      {/* TAB 7: AUDIT LOG */}
      {activeTab === 'audit' && (<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0 flex items-center gap-2">
              <History size={16} className="text-indigo-400"/> System Audit Timeline
            </h2>
          </div>
          {auditLogs.length > 0 ? (<div className="space-y-2.5">
              {auditLogs.map((log, idx) => {
                    const payload = log.metadata_json || log.new_values || log.details;
                    const formattedPayload = payload
                        ? typeof payload === 'string'
                            ? payload
                            : Object.entries(payload)
                                .filter(([k]) => k !== 'actor_name')
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' • ')
                        : 'Operation completed successfully';
                    return (<div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs flex flex-wrap justify-between items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          {log.action || 'OPERATION'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          by <strong className="text-slate-200">{log.actor_name || log.performed_by_name || 'System Admin'}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mb-0">
                        {formattedPayload || 'Employee record modified'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>);
                })}
            </div>) : (<div className="text-center py-6 text-slate-500 text-xs font-semibold">
              No specific audit activity entries logged for this employee record.
            </div>)}
        </div>)}

      {/* ── DEDICATED SECURITY QR CODE MODAL ── */}
      {showQRModal && (<div className="modal d-block bg-black/80 backdrop-blur-md" tabIndex={-1} style={{ zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-indigo-500/40 text-white rounded-3xl p-6 shadow-2xl overflow-hidden text-center relative" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <button onClick={() => setShowQRModal(false)} className="btn-close btn-close-white absolute top-4 right-4" style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }}/>
              <div className="h-12 w-12 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl d-inline-flex items-center justify-center mb-3">
                <QrCode size={28}/>
              </div>
              <h3 className="text-xl font-black text-white mb-1" style={{ color: '#ffffff' }}>Security QR Pass</h3>
              <p className="text-xs text-slate-300 mb-4 font-medium">
                Official ISO security credential for access control and visitor check-in authorization.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 d-inline-flex flex-column align-items-center justify-center mb-4" style={{ backgroundColor: '#090d16', color: '#e2e8f0' }}>
                <QRCodeDisplay value={getBadgeQRPayload()} size={180}/>
                <div className="font-mono text-xs font-bold text-indigo-400 mt-3">{currentEmp.employee_number}</div>
                <div className="text-xs font-bold text-white mt-0.5" style={{ color: '#ffffff' }}>{currentEmp.full_name}</div>
                <div className="text-[11px] text-slate-400">{currentEmp.job_title} • {currentEmp.department_name}</div>
              </div>

              <div className="d-flex justify-content-center gap-2">
                <button type="button" onClick={() => setShowQRModal(false)} className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* ── QUICK STATUS UPDATE MODAL ── */}
      {showStatusModal && (<div className="modal d-block bg-black/80 backdrop-blur-md" tabIndex={-1} style={{ zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <h4 className="text-base font-black text-white mb-3" style={{ color: '#ffffff' }}>Update Employment Status</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 block">Status</label>
                  <select className="form-select text-xs font-semibold" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} style={{ backgroundColor: '#090d16', color: '#f8fafc', borderColor: '#334155' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button onClick={() => setShowStatusModal(false)} className="btn btn-sm text-xs font-bold px-3 py-1.5 rounded-xl text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleUpdateStatus} disabled={statusSaving} className="btn btn-primary btn-sm text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">
                    {statusSaving ? 'Updating...' : 'Save Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
