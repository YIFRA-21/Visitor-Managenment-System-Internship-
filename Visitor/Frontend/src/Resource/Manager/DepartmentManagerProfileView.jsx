import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  QrCode, 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Edit3, 
  Printer, 
  Sparkles, 
  BadgeCheck, 
  X, 
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Briefcase,
  Layers,
  Award
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { authApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

export default function DepartmentManagerProfileView() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const { toSuccess, toError, toConfirmation } = useResponseNavigation();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState(null);

  // Modal states
  const [showQrModal, setShowQrModal] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    office: '',
    emergencyContact: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const userKey = `user_photo_${user?.id || 'manager'}`;
      const savedPhoto = 
        sessionStorage.getItem(userKey) || 
        localStorage.getItem(userKey) || 
        sessionStorage.getItem('manager_profile_photo') || 
        localStorage.getItem('manager_profile_photo') || 
        user?.avatarUrl || 
        user?.avatar || 
        null;

      const data = await managerApi.getProfile().catch(() => null);
      const backendData = data?.data || data || {};

      // Strictly real data from database & authenticated session
      const merged = {
        id: user?.id || backendData.id || '',
        manager_number: user?.userCode || backendData.manager_number || backendData.user_code || (user?.id ? `MGR-${user.id}` : ''),
        full_name: user?.fullName || backendData.full_name || `${backendData.first_name || ''} ${backendData.last_name || ''}`.trim() || user?.username || user?.name || '',
        email: user?.email || backendData.email || '',
        phone: user?.phone || backendData.phone || backendData.phone_number || '',
        position: backendData.position || user?.jobTitle || user?.role_name || user?.role || 'Department Manager',
        department_name: backendData.department_name || user?.department_name || user?.department || '',
        department_code: backendData.department_code || '',
        branch_name: backendData.branch_name || user?.branch_name || user?.branch || '',
        organization_name: backendData.organization_name || user?.organization_name || user?.organization || '',
        office: backendData.office || '',
        approval_authority_level: backendData.approval_authority_level || '',
        security_clearance: backendData.security_clearance || 'Department Authority',
        emergency_contact: backendData.emergency_contact || '',
        status: user?.status || backendData.status || 'Active',
        photo_url: savedPhoto || backendData.avatar_url || backendData.photo_url || backendData.profile_photo || user?.avatarUrl || user?.avatar || null,
      };

      setProfile(merged);
      setPhotoPreview(merged.photo_url);
      setEditForm({
        fullName: merged.full_name,
        phone: merged.phone,
        office: merged.office,
        emergencyContact: merged.emergency_contact,
      });
    } catch (err) {
      console.warn('Error fetching manager profile:', err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to fetch manager profile') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Generate Digital QR Pass
  useEffect(() => {
    if (profile?.manager_number) {
      const payload = [
        `ROLE: DEPARTMENT_MANAGER`,
        `ID: ${profile.manager_number}`,
        `NAME: ${profile.full_name}`,
        `DEPT: ${profile.department_name} (${profile.department_code})`,
        `OFFICE: ${profile.office}`,
        `CLEARANCE: Level ${profile.approval_authority_level}`,
        `EMAIL: ${profile.email}`,
      ].join('\n');

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: { dark: '#0a0f1d', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code error:', err));
    }
  }, [profile]);

  // Profile Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Url = evt.target?.result;
      if (base64Url) {
        setPhotoPreview(base64Url);
        const userKey = `user_photo_${user?.id || 'manager'}`;

        try {
          sessionStorage.setItem(userKey, base64Url);
          localStorage.setItem(userKey, base64Url);
          sessionStorage.setItem('manager_profile_photo', base64Url);
          localStorage.setItem('manager_profile_photo', base64Url);

          if (updateUser) {
            updateUser({ avatarUrl: base64Url });
          }

          // Real-time event dispatch for Navbar avatar
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('user-profile-updated'));

          // Persist to backend
          await managerApi.updateProfile({ photoUrl: base64Url, avatarUrl: base64Url });
          await authApi.updateProfile({ avatarUrl: base64Url }).catch(() => {});

          setProfile((prev) => ({ ...prev, photo_url: base64Url }));
          toSuccess({
            type: RESPONSE_TYPES.PROFILE_UPDATED,
            title: 'Photo Synchronized',
            message: 'Executive management photo updated and synchronized across the enterprise.',
            entityType: 'Executive Photo',
            returnUrl: window.location.pathname + window.location.search,
          });
        } catch (err) {
          toError(err, {
            title: 'Failed to Update Photo',
            entityType: 'Executive Photo',
            returnUrl: window.location.pathname + window.location.search,
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo Handler
  const handleRemovePhoto = async () => {
    toConfirmation({
      title: 'Confirm Executive Photo Removal',
      message: 'Remove your executive portrait? A default identity avatar will be displayed across executive panels.',
      entityType: 'Executive Portrait',
      entityName: user?.fullName || 'Manager Photo',
      consequences: [
        'Your photo will be cleared from visitor pass approvals and departmental dashboards.',
        'You can upload a new corporate portrait at any time.'
      ],
      confirmLabel: 'Remove Executive Photo',
      confirmVariant: 'danger',
      returnUrl: window.location.pathname + window.location.search,
      onConfirm: async () => {
        setPhotoPreview(null);
        const userKey = `user_photo_${user?.id || 'manager'}`;
        try {
          sessionStorage.removeItem(userKey);
          localStorage.removeItem(userKey);
          sessionStorage.removeItem('manager_profile_photo');
          localStorage.removeItem('manager_profile_photo');

          if (updateUser) {
            updateUser({ avatarUrl: '' });
          }

          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('user-profile-updated'));

          await managerApi.updateProfile({ photoUrl: null, avatarUrl: '' });
          await authApi.updateProfile({ avatarUrl: '' }).catch(() => {});
          setProfile((prev) => ({ ...prev, photo_url: null }));
        } catch (err) {
          console.error(err);
        }
      },
      successConfig: {
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Photo Removed',
        message: 'Your executive portrait has been cleared.',
      }
    });
  };

  // Edit Info Submit Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await managerApi.updateProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
        office: editForm.office,
      });

      await authApi.updateProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
      }).catch(() => {});

      if (updateUser) {
        updateUser({ fullName: editForm.fullName, phone: editForm.phone });
      }

      setProfile((prev) => ({
        ...prev,
        full_name: editForm.fullName,
        phone: editForm.phone,
        office: editForm.office,
      }));

      toSuccess({
        type: RESPONSE_TYPES.PROFILE_UPDATED,
        title: 'Executive Profile Updated',
        message: 'Department manager details updated and synchronized successfully.',
        entityType: 'Manager Profile',
        returnUrl: window.location.pathname + window.location.search,
      });
    } catch (err) {
      toError(err, {
        title: 'Failed to Update Profile',
        entityType: 'Manager Profile',
        returnUrl: window.location.pathname + window.location.search,
      });
    } finally {
      setSaving(false);
    }
  };

  // Password Change Handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toSuccess({
        type: RESPONSE_TYPES.PASSWORD_RESET_SUCCESS,
        title: 'Password Security Updated',
        message: 'Your executive managerial credentials have been updated securely.',
        entityType: 'Executive Security',
        returnUrl: window.location.pathname + window.location.search,
      });
    } catch (err) {
      toError(err, {
        title: 'Password Change Failed',
        entityType: 'Executive Security',
        returnUrl: window.location.pathname + window.location.search,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const photoSrc = photoPreview || profile?.photo_url || null;

  return (
    <div className="min-h-screen bg-[#080d16] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard" />
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Department Manager Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                Authorized Executive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Organizational governance, department authority level, and personal executive contact parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <QrCode className="h-4 w-4 text-indigo-400" />
            <span>Digital Pass</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Edit3 className="h-4 w-4" />
            <span>{activeTab === 'edit' ? 'View Overview' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border text-xs font-semibold shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HERO EXECUTIVE IDENTITY CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/30 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 overflow-hidden shadow-xl flex items-center justify-center">
              {photoSrc ? (
                <img
                  src={resolvePhotoUrl(photoSrc)}
                  alt={profile?.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-indigo-400">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'M'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg border border-indigo-400/50 transition cursor-pointer"
              title="Upload new profile photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Profile Identity Details */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {profile?.full_name || 'Department Manager'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <BadgeCheck className="h-3 w-3" /> Level {profile?.approval_authority_level} Authority
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-indigo-300">
                {profile?.manager_number || 'N/A'}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-300">
              {profile?.position || 'Department Manager'} {profile?.department_name ? `• ${profile.department_name}${profile?.department_code ? ` (${profile.department_code})` : ''}` : ''}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400 font-medium">
              {profile?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  {profile.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-indigo-400" />
                {profile?.phone || 'Not provided'}
              </span>
              {profile?.branch_name && (
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-indigo-400" />
                  {profile.branch_name}
                </span>
              )}
            </div>
          </div>

          {/* Scope Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center md:text-right shrink-0 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
              Office Assignment
            </span>
            <div className="text-sm font-black text-indigo-300">
              {profile?.office || 'Not Assigned'}
            </div>
            <span className="text-[11px] text-emerald-400 block font-bold">
              {profile?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Governance & Scope</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'edit'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit Executive Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'photo'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Profile Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Department Authority */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" />
              <span>Department Governance & Scope</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Department Name:</span>
                <span className="font-bold text-white">{profile?.department_name} ({profile?.department_code})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Approval Authority Level:</span>
                <span className="font-bold text-emerald-400">{profile?.approval_authority_level ? `Level ${profile.approval_authority_level} Authority` : 'Standard Authority'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Branch Office:</span>
                <span className="font-bold text-slate-200">{profile?.branch_name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Parent Organization:</span>
                <span className="font-bold text-slate-200">{profile?.organization_name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Executive Office:</span>
                <span className="font-bold text-indigo-300">{profile?.office || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {/* Card: Identity & Clearances */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Executive Clearance & Contacts</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Security Clearance:</span>
                <span className="font-bold text-indigo-300">{profile?.security_clearance || 'Department Authority'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Corporate Email:</span>
                <span className="font-mono text-slate-200">{profile?.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Office Phone:</span>
                <span className="font-bold text-white">{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Emergency Phone:</span>
                <span className="font-bold text-slate-300">{profile?.emergency_contact || 'None'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Status:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {profile?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <div className="max-w-2xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Edit Executive Information
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update personal contact and room office coordinates for hosting notifications.
            </p>
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">
                Corporate Email (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-400 cursor-not-allowed pl-9"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider block">
                  Office Phone / Mobile
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider block">
                  Office Location
                </label>
                <input
                  type="text"
                  value={editForm.office}
                  onChange={(e) => setEditForm((f) => ({ ...f, office: e.target.value }))}
                  placeholder="Executive Wing Suite 301"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Emergency Contact Phone
              </label>
              <input
                type="text"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                placeholder="+1 (555) 019-3920"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PHOTO MANAGEMENT */}
      {activeTab === 'photo' && (
        <div className="max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Executive Profile Photo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload a high-resolution portrait. Displays in the navbar, department directory, and approval workflows.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 overflow-hidden shadow-xl flex items-center justify-center shrink-0">
              {photoSrc ? (
                <img
                  src={resolvePhotoUrl(photoSrc)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-black text-indigo-400">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'M'}
                </span>
              )}
            </div>

            <div className="space-y-3 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Upload className="h-4 w-4" />
                <span>Upload New Portrait</span>
              </button>

              {photoSrc && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-full py-2.5 px-4 bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove Current Photo</span>
                </button>
              )}

              <p className="text-[11px] text-slate-500 text-center sm:text-left">
                Supports JPG, PNG, WebP up to 5MB. Live preview updates immediately in the top navigation bar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & CREDENTIALS */}
      {activeTab === 'security' && (
        <div className="max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-indigo-400" />
              <span>Change Account Password</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure your department managerial account with a strong, multi-character password.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {changingPassword ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR DIGITAL BADGE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                Department Executive Badge Pass
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pass Card Preview */}
            <div className="p-4 bg-white rounded-2xl shadow-inner text-slate-900 space-y-2">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                Enterprise Host Authority
              </div>
              <h4 className="text-base font-black text-slate-900">{profile?.full_name}</h4>
              <p className="text-[11px] font-mono font-bold text-indigo-600">{profile?.manager_number}</p>

              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Badge QR"
                  className="w-48 h-48 mx-auto rounded-xl border border-slate-200"
                />
              )}

              <div className="text-[10px] font-bold text-slate-600">
                {profile?.department_name} • Level {profile?.approval_authority_level}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Printer className="h-4 w-4" />
                <span>Print Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
