import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, QrCode, Key, Camera, Upload, Trash2, CheckCircle2, AlertCircle, Briefcase, MapPin, Lock, Edit3, RefreshCw, Printer, BadgeCheck, ShieldCheck, X, Sparkles, Eye, EyeOff } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api, { profileApi } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import BackButton from '../../components/common/BackButton';
import CountryPhoneInput from '../../components/common/CountryPhoneInput';
import FieldError from '../../components/common/FieldError';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';
import {
    validatePhone,
    validatePassword,
    validatePasswordConfirmation
} from '../../utils/formValidation';

export default function EmployeeProfileView() {
    const { t } = useLanguage();
    const { user, updateUser } = useAuth();
    const { toSuccess, toError, toConfirmation } = useResponseNavigation();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [profile, setProfile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [message, setMessage] = useState(null);
    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    // Form states
    const [editForm, setEditForm] = useState({
        phone: '',
        office_location: '',
        emergency_contact: '',
    });
    const [editErrors, setEditErrors] = useState({});
    const clearEditError = (f) => {
        if (editErrors[f]) {
            setEditErrors(prev => {
                const next = { ...prev };
                delete next[f];
                return next;
            });
        }
    };
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});
    const clearPasswordError = (f) => {
        if (passwordErrors[f]) {
            setPasswordErrors(prev => {
                const next = { ...prev };
                delete next[f];
                return next;
            });
        }
    };
    const userAny = user;
    const fetchProfile = async () => {
        setLoading(true);
        const isAdmin = userAny?.role === 'admin';
        const userKey = `user_photo_${userAny?.id || 'admin'}`;
        const savedPhoto = userAny?.avatarUrl || userAny?.avatar || userAny?.photo_url || userAny?.profile_photo || sessionStorage.getItem(userKey) || localStorage.getItem(userKey) || sessionStorage.getItem('admin_profile_photo') || localStorage.getItem('admin_profile_photo') || null;
        const fallbackProfile = {
            id: userAny?.id || 1,
            employee_code: userAny?.userCode || userAny?.employee_code || (isAdmin ? 'ADM000001' : 'EMP-10482'),
            reference_no: 'REF-SYS-2026-001',
            full_name: userAny?.fullName || userAny?.full_name || userAny?.username || (isAdmin ? 'Girume Admin' : 'Staff User'),
            email: userAny?.email || (isAdmin ? 'girume1229@gmail.com' : 'employee@visitor.com'),
            phone: userAny?.phone || '+1 (555) 019-2834',
            emergency_contact: '+1 (555) 992-0012',
            department: userAny?.department || (isAdmin ? 'Operations & Support' : 'Operations & Support'),
            designation: userAny?.jobTitle || userAny?.designation || (isAdmin ? 'Authorized Host' : 'Authorized Host'),
            status: isAdmin ? 'ACTIVE HOST' : 'ACTIVE HOST',
            security_clearance: isAdmin ? 'Level 3 (Host Access)' : 'Level 3 (Host Access)',
            office_location: 'HQ Building A, Suite 501',
            joined_date: 'Jan 15, 2022',
            photo_url: savedPhoto,
            max_guests: 15,
            escort_required: 'Standard Policy'
        };
        try {
            const res = await api.get('/employees/me');
            const data = res.data || {};
            const merged = {
                ...fallbackProfile,
                ...data,
                employee_code: (data.employee_code || data.employee_number || fallbackProfile.employee_code).replace(/^DEV/, 'ADM'),
                full_name: data.full_name || data.fullName || fallbackProfile.full_name,
                email: data.email || fallbackProfile.email,
                department: data.department || data.department_name || fallbackProfile.department,
                designation: data.designation || data.job_title || fallbackProfile.designation,
                photo_url: data.photo_url || data.photo || data.avatar_url || savedPhoto || fallbackProfile.photo_url,
            };
            setProfile(merged);
            setPhotoPreview(merged.photo_url);
            setEditForm({
                phone: merged.phone || '',
                office_location: merged.office_location || 'HQ Building A, Suite 501',
                emergency_contact: merged.emergency_contact || '+1 (555) 992-0012',
            });
        }
        catch (err) {
            setProfile(fallbackProfile);
            setPhotoPreview(fallbackProfile.photo_url);
            setEditForm({
                phone: fallbackProfile.phone,
                office_location: fallbackProfile.office_location,
                emergency_contact: fallbackProfile.emergency_contact,
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, [user]);
    // Generate QR Code for Admin Pass
    useEffect(() => {
        if (profile?.employee_code) {
            const qrPayload = [
                `ID: ${profile.employee_code}`,
                `Name: ${profile.full_name}`,
                `Role: ${profile.designation}`,
                `Dept: ${profile.department}`,
                `Clearance: ${profile.security_clearance}`,
                `Email: ${profile.email}`,
                `Status: ${profile.status}`
            ].join('\n');
            QRCode.toDataURL(qrPayload, {
                width: 360,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
                errorCorrectionLevel: 'H'
            })
                .then(url => setQrDataUrl(url))
                .catch(err => console.error('QR generation error:', err));
        }
    }, [profile]);
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;

        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
            toError(new Error('Please select a valid image file (JPEG, PNG, WEBP).'), {
                title: 'Invalid File Type',
                entityType: 'Employee Photo'
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toError(new Error('Profile photo size must be less than 5MB.'), {
                title: 'File Too Large',
                entityType: 'Employee Photo'
            });
            return;
        }

        try {
            setUploadingPhoto(true);
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await profileApi.uploadAvatar(formData);
            const newAvatarUrl = res.data?.avatarUrl;

            if (newAvatarUrl) {
                setPhotoPreview(newAvatarUrl);
                setProfile(prev => prev ? ({ ...prev, photo_url: newAvatarUrl }) : null);

                const userKey = `user_photo_${userAny?.id || 'admin'}`;
                const roleLower = userAny?.role?.toLowerCase();
                try {
                    sessionStorage.setItem(userKey, newAvatarUrl);
                    localStorage.setItem(userKey, newAvatarUrl);
                    if (roleLower === 'admin') {
                        sessionStorage.setItem('admin_profile_photo', newAvatarUrl);
                        localStorage.setItem('admin_profile_photo', newAvatarUrl);
                    }
                    else if (roleLower === 'employee' || roleLower === 'staff') {
                        sessionStorage.setItem('employee_uploaded_photo', newAvatarUrl);
                        localStorage.setItem('employee_uploaded_photo', newAvatarUrl);
                    }
                }
                catch (err) { }

                if (updateUser) {
                    updateUser({ avatarUrl: newAvatarUrl, avatar: newAvatarUrl, profile_photo: newAvatarUrl });
                }

                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('user-profile-updated'));

                toSuccess({
                    type: RESPONSE_TYPES.PROFILE_UPDATED,
                    title: 'Photo Synchronized',
                    message: 'Employee host profile photo updated and synchronized successfully.',
                    entityType: 'Employee Photo',
                    returnUrl: window.location.pathname + window.location.search,
                });
            }
        }
        catch (err) {
            toError(err, {
                title: 'Failed to Upload Photo',
                entityType: 'Employee Photo',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    const handleRemovePhoto = () => {
        toConfirmation({
            title: 'Confirm Profile Photo Removal',
            message: 'Remove your corporate identity photo? A default avatar placeholder will be used.',
            entityType: 'Profile Photo',
            entityName: userAny?.fullName || 'User Photo',
            consequences: [
                'Your photo will be cleared from reception, security turnstiles, and directory lookup.',
                'A new photo can be uploaded at any time.'
            ],
            confirmLabel: 'Remove Photo',
            confirmVariant: 'danger',
            returnUrl: window.location.pathname + window.location.search,
            onConfirm: async () => {
                try {
                    setUploadingPhoto(true);
                    await profileApi.deleteAvatar().catch(() => {});
                    setPhotoPreview(null);
                    setProfile(prev => prev ? ({ ...prev, photo_url: null }) : null);

                    const userKey = `user_photo_${userAny?.id || 'admin'}`;
                    const roleLower = userAny?.role?.toLowerCase();
                    try {
                        sessionStorage.removeItem(userKey);
                        localStorage.removeItem(userKey);
                        if (roleLower === 'admin') {
                            sessionStorage.removeItem('admin_profile_photo');
                            localStorage.removeItem('admin_profile_photo');
                        }
                        else if (roleLower === 'employee' || roleLower === 'staff') {
                            sessionStorage.removeItem('employee_uploaded_photo');
                            localStorage.removeItem('employee_uploaded_photo');
                        }
                    }
                    catch (e) { }

                    if (updateUser) {
                        updateUser({ avatarUrl: '', avatar: '', profile_photo: '' });
                    }
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('user-profile-updated'));
                }
                finally {
                    setUploadingPhoto(false);
                }
            },
            successConfig: {
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Photo Removed',
                message: 'Your profile photo has been cleared.',
            }
        });
    };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const newErrs = {};
        if (editForm.phone) {
            const err = validatePhone(editForm.phone, t('form.workPhone', 'Work Phone Number'), false);
            if (err) newErrs.phone = err;
        }
        if (editForm.emergency_contact) {
            const err = validatePhone(editForm.emergency_contact, t('form.emergencyContact', 'Emergency Contact Number'), false);
            if (err) newErrs.emergency_contact = err;
        }
        if (Object.keys(newErrs).length > 0) {
            setEditErrors(newErrs);
            return;
        }

        setSaving(true);
        try {
            await api.put('/employees/me', editForm);
            setProfile((prev) => ({ ...prev, ...editForm }));
            setShowEditModal(false);
            setEditErrors({});
            toSuccess({
                type: RESPONSE_TYPES.PROFILE_UPDATED,
                title: 'Profile Updated Successfully',
                message: 'Your contact and departmental information has been saved.',
                entityType: 'Employee Profile',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            toError(err, {
                title: 'Profile Update Failed',
                entityType: 'Employee Profile',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setSaving(false);
        }
    };
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const newErrs = {};
        if (!passwordForm.currentPassword) {
            newErrs.currentPassword = 'Current password is required.';
        }
        const newPassErr = validatePassword(passwordForm.newPassword, 'New Password');
        if (newPassErr) newErrs.newPassword = newPassErr;
        const confirmErr = validatePasswordConfirmation(passwordForm.newPassword, passwordForm.confirmPassword);
        if (confirmErr) newErrs.confirmPassword = confirmErr;

        if (Object.keys(newErrs).length > 0) {
            setPasswordErrors(newErrs);
            return;
        }

        setSaving(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setShowPasswordModal(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordErrors({});
            toSuccess({
                type: RESPONSE_TYPES.PASSWORD_RESET_SUCCESS,
                title: 'Password Security Updated',
                message: 'Your account credentials have been updated securely.',
                entityType: 'Account Security',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            toError(err, {
                title: 'Password Change Failed',
                entityType: 'Account Security',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<div className="p-8 text-center bg-[#070b13] min-h-screen flex items-center justify-center">
        <div className="space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto"/>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Syncing Admin Profile...</p>
        </div>
      </div>);
    }
    const tabs = [
        { key: 'personal', label: 'Personal Information', icon: <User size={14}/> },
        { key: 'contact', label: 'Contact Information', icon: <Mail size={14}/> },
        { key: 'photo', label: 'Photo Management', icon: <Camera size={14}/> },
        { key: 'employment', label: 'Employment & Role', icon: <Briefcase size={14}/> },
        { key: 'security', label: 'Security Clearance', icon: <Shield size={14}/> },
        { key: 'office', label: 'Office Details', icon: <MapPin size={14}/> },
        { key: 'account', label: 'Account Credentials', icon: <Key size={14}/> },
    ];
    return (<div className="p-4 sm:p-6 md:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* Toast Notification Banner */}
      {message && (<div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
            <span className="text-xs font-bold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>)}

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block mb-0.5">
              System Administration
            </span>
            <h1 className="text-xl font-black text-white">Administrator Profile</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold flex items-center gap-2 transition-all">
            <Edit3 size={14}/>
            <span>Edit Profile</span>
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition-all">
            <Printer size={14}/>
            <span>Print Profile</span>
          </button>
          <button onClick={() => setShowQrModal(true)} className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-2 transition-all">
            <QrCode size={14}/>
            <span>Security Pass QR</span>
          </button>
        </div>
      </div>

      {/* TOP HEADER CARD — Styled like Visitor Profile Details */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 relative z-10">
          
          {/* Avatar Photo Box with Camera Icon */}
          <div className="relative group shrink-0">
            <div className="h-32 w-32 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 p-1 overflow-hidden flex items-center justify-center shadow-2xl relative">
              {uploadingPhoto ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-indigo-400">
                  <RefreshCw className="h-6 w-6 animate-spin mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Uploading...</span>
                </div>
              ) : photoPreview ? (
                <img src={resolvePhotoUrl(photoPreview)} alt={profile?.full_name} className="h-full w-full object-cover rounded-xl"/>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center justify-center text-white font-black text-3xl">
                  {profile?.full_name?.substring(0, 2)?.toUpperCase() || 'AD'}
                </div>
              )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden"/>

            <div className="absolute -bottom-2 -right-2 flex space-x-1">
              <button type="button" disabled={uploadingPhoto} onClick={() => fileInputRef.current?.click()} title="Upload Photo" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg border border-indigo-400/30 transition-transform active:scale-95 disabled:opacity-50">
                <Camera className="h-4 w-4"/>
              </button>
              {photoPreview && (
                <button type="button" disabled={uploadingPhoto} onClick={handleRemovePhoto} title="Remove Photo" className="p-2 bg-rose-600/80 hover:bg-rose-700 text-white rounded-xl shadow-lg border border-rose-400/30 transition-transform active:scale-95 disabled:opacity-50">
                  <Trash2 className="h-4 w-4"/>
                </button>
              )}
            </div>
          </div>

          {/* Center Details Grid */}
          <div className="flex-1 text-center lg:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {profile?.full_name}
                <BadgeCheck className="h-6 w-6 text-blue-400 shrink-0 inline"/>
              </h2>

              <span className="font-mono text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Admin ID: {profile?.employee_code || 'ADM001'}
              </span>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Ref No.: {profile?.reference_no || 'REF-SYS-2026-001'}
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                {profile?.status || 'ACTIVE ADMINISTRATOR'}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-300">
              {profile?.designation} • {profile?.department}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">DEPARTMENT</span>
                <span className="font-bold text-white truncate block">{profile?.department}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">EMAIL</span>
                <span className="font-bold text-slate-300 truncate block">{profile?.email}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">PHONE</span>
                <span className="font-bold text-slate-300 truncate block">{profile?.phone}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CLEARANCE</span>
                <span className="font-bold text-purple-400 truncate block">{profile?.security_clearance}</span>
              </div>
            </div>
          </div>

          {/* Right Side: QR Pass Card Box — Styled like Visitor Profile QR */}
          <div className="shrink-0 w-full lg:w-48 bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xl">
            <div onClick={() => setShowQrModal(true)} className="p-2 bg-white rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-transform mb-2">
              {qrDataUrl ? (<img src={qrDataUrl} alt="Security Pass QR" className="w-28 h-28 object-contain rounded-lg"/>) : (<div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-800"/>
                </div>)}
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
              Scan for Security Pass
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
              Valid ID: {profile?.employee_code || 'ADM001'}
            </span>
          </div>

        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE TAB NAVIGATION — Styled like Visitor Profile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80">
        {tabs.map((t) => (<button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === t.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'}`}>
            {t.icon}
            <span>{t.label}</span>
          </button>))}
      </div>

      {/* TABBED CONTENT CARDS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* TAB 1: Personal Information */}
        {activeTab === 'personal' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400"/>
                <span>Personal Information</span>
              </h3>
              <button onClick={() => setShowEditModal(true)} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                <Edit3 size={13}/> Edit Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Full Name</span>
                <span className="text-white font-extrabold text-sm">{profile?.full_name}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Admin ID Code</span>
                <span className="text-indigo-300 font-mono font-extrabold text-sm">{profile?.employee_code}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Designation Title</span>
                <span className="text-white font-extrabold text-sm">{profile?.designation}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Department</span>
                <span className="text-white font-bold">{profile?.department}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Account Role</span>
                <span className="text-emerald-400 font-bold uppercase">{userAny?.role || 'Administrator'}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Joined Organization</span>
                <span className="text-slate-300 font-semibold">{profile?.joined_date}</span>
              </div>
            </div>
          </div>)}

        {/* TAB 2: Contact Information */}
        {activeTab === 'contact' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-400"/>
                <span>Contact Information</span>
              </h3>
              <button onClick={() => setShowEditModal(true)} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                <Edit3 size={13}/> Edit Contact
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Email Address</span>
                <span className="text-indigo-300 font-semibold text-sm">{profile?.email}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Work Phone</span>
                <span className="text-white font-bold">{profile?.phone}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Emergency Contact</span>
                <span className="text-slate-300 font-semibold">{profile?.emergency_contact}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Primary Office</span>
                <span className="text-white font-bold">{profile?.office_location}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Facility HQ</span>
                <span className="text-slate-300 font-semibold">HQ Building A, Suite 501</span>
              </div>
            </div>
          </div>)}

        {/* TAB 3: Photo Management — Styled like Visitor Profile Photo Tab */}
        {activeTab === 'photo' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-400"/>
                <span>Profile Photo Management</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Display Card */}
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-44 w-44 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 p-1 overflow-hidden flex items-center justify-center shadow-2xl relative">
                  {photoPreview ? (<img src={photoPreview} alt={profile?.full_name} className="h-full w-full object-cover rounded-xl"/>) : (<User size={64} className="text-slate-600"/>)}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">{profile?.full_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">ID: {profile?.employee_code}</span>
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                    {photoPreview ? '✓ Photo Active & Synced' : 'No Photo Uploaded'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                    <Upload size={14}/> Upload New Photo
                  </button>
                  {photoPreview && (<button onClick={handleRemovePhoto} className="px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-bold flex items-center gap-2">
                      <Trash2 size={14}/> Remove Photo
                    </button>)}
                </div>
              </div>

              {/* Upload Info & Guidelines Card */}
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400"/>
                  <span>Photo Guidelines & Sync Status</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5"/>
                    <span>Photo is synced in real-time across the top Navbar and bottom Sidebar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5"/>
                    <span>Supported formats: JPG, PNG, WEBP. Max file size: 5MB.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5"/>
                    <span>Images are automatically saved as persistent Base64 Data URLs.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>)}

        {/* TAB 4: Employment & Role */}
        {activeTab === 'employment' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400"/>
                <span>Employment & Role Overview</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Admin ID Code</span>
                <span className="text-white font-mono font-bold text-sm">{profile?.employee_code}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Primary Department</span>
                <span className="text-white font-bold">{profile?.department}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Designation Title</span>
                <span className="text-white font-bold">{profile?.designation}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Host Security Status</span>
                <span className="text-emerald-400 font-bold">Authorized Host</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Max Guests Allowed Per Day</span>
                <span className="text-indigo-300 font-mono font-extrabold">{profile?.max_guests || 15} Visitors</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Escort Policy</span>
                <span className="text-slate-300 font-semibold">{profile?.escort_required || 'Standard Policy'}</span>
              </div>
            </div>
          </div>)}

        {/* TAB 5: Security Clearance */}
        {activeTab === 'security' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400"/>
                <span>Security Clearance & Permissions</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Clearance Level</span>
                <span className="text-purple-400 font-extrabold text-sm">{profile?.security_clearance}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Gate Access Pass</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14}/> Active & Valid
                </span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Security Badge Status</span>
                <span className="text-blue-400 font-bold">Verified & Active</span>
              </div>
            </div>
          </div>)}

        {/* TAB 6: Office Details */}
        {activeTab === 'office' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-400"/>
                <span>Office Details & Facility Location</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Primary Office Location</span>
                <span className="text-white font-bold">{profile?.office_location}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Work Phone</span>
                <span className="text-slate-300 font-semibold">{profile?.phone}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Emergency Contact</span>
                <span className="text-slate-300 font-semibold">{profile?.emergency_contact}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Email Address</span>
                <span className="text-indigo-300 font-semibold">{profile?.email}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-slate-500 font-bold block mb-1">Building HQ</span>
                <span className="text-slate-300 font-semibold">HQ Building A, Suite 501</span>
              </div>
            </div>
          </div>)}

        {/* TAB 7: Account Credentials */}
        {activeTab === 'account' && (<div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400"/>
                <span>Account Credentials & Security Settings</span>
              </h3>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4 max-w-xl">
              <div>
                <h4 className="text-sm font-bold text-white">Password & Authentication</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Change your account login password and update security credentials.
                </p>
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all">
                <Lock size={14}/>
                <span>Change Password</span>
              </button>
            </div>
          </div>)}

      </div>

      {/* EDIT CONTACT MODAL */}
      {showEditModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-indigo-400"/>
                <span>Edit Contact Details</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X size={16}/>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} noValidate className="space-y-4 text-xs font-semibold">
              <div>
                <CountryPhoneInput
                  id="emp-profile-work-phone"
                  label={t('form.workPhone', 'Work Phone Number')}
                  value={editForm.phone}
                  onChange={(e) => {
                    setEditForm({ ...editForm, phone: e.target.value });
                    clearEditError('phone');
                  }}
                  error={editErrors.phone}
                  placeholder="Phone number"
                />
                <FieldError error={editErrors.phone} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.officeLocation', 'Office Location')}</label>
                <input
                  type="text"
                  value={editForm.office_location}
                  onChange={(e) => setEditForm({ ...editForm, office_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <CountryPhoneInput
                  id="emp-profile-emergency-phone"
                  label={t('form.emergencyContact', 'Emergency Contact Number')}
                  value={editForm.emergency_contact}
                  onChange={(e) => {
                    setEditForm({ ...editForm, emergency_contact: e.target.value });
                    clearEditError('emergency_contact');
                  }}
                  error={editErrors.emergency_contact}
                  placeholder="Emergency phone number"
                />
                <FieldError error={editErrors.emergency_contact} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold">
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                  {saving ? t('form.loading', 'Saving...') : t('btn.saveChanges', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400"/>
                <span>{t('form.changeAccountPassword', 'Change Account Password')}</span>
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X size={16}/>
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.currentPassword', 'Current Password')}</label>
                <div className="relative flex items-center">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    data-invalid={Boolean(passwordErrors.currentPassword)}
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                      clearPasswordError('currentPassword');
                    }}
                    className={`w-full bg-slate-950 rounded-xl px-3 py-2.5 pr-10 text-white focus:outline-none transition-all ${
                      passwordErrors.currentPassword ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 text-slate-400 hover:text-white">
                    {showCurrentPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError error={passwordErrors.currentPassword} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.newPassword', 'New Password (Min 8 chars, mixed case & numbers)')}</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    data-invalid={Boolean(passwordErrors.newPassword)}
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                      clearPasswordError('newPassword');
                    }}
                    className={`w-full bg-slate-950 rounded-xl px-3 py-2.5 pr-10 text-white focus:outline-none transition-all ${
                      passwordErrors.newPassword ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 text-slate-400 hover:text-white">
                    {showNewPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError error={passwordErrors.newPassword} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.confirmPassword', 'Confirm New Password')}</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    data-invalid={Boolean(passwordErrors.confirmPassword)}
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                      clearPasswordError('confirmPassword');
                    }}
                    className={`w-full bg-slate-950 rounded-xl px-3 py-2.5 pr-10 text-white focus:outline-none transition-all ${
                      passwordErrors.confirmPassword ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 text-slate-400 hover:text-white">
                    {showConfirmPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError error={passwordErrors.confirmPassword} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold">
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                  {saving ? t('form.loading', 'Updating...') : t('btn.updatePassword', 'Update Password')}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* DIGITAL SECURITY QR PASS MODAL */}
      {showQrModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center space-y-4 text-slate-100">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16}/>
            </button>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block">
                Digital Security Credentials
              </span>
              <h3 className="text-base font-black text-white">{profile?.full_name}</h3>
              <p className="text-xs text-slate-400 font-semibold">{profile?.designation}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl my-2">
              {qrDataUrl ? (<img src={qrDataUrl} alt="Security Pass QR" className="w-48 h-48 object-contain rounded-lg mx-auto"/>) : (<div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-slate-800 animate-pulse"/>
                </div>)}
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-mono font-bold text-indigo-300">ID: {profile?.employee_code || 'ADM001'}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Security Clearance: {profile?.security_clearance}</div>
            </div>

            <button onClick={() => window.print()} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2">
              <Printer size={14}/> Print Badge Pass
            </button>
          </div>
        </div>)}

    </div>);
}
