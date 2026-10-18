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
  Radio,
  Crosshair,
  Sliders
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { securityApi, authApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import FieldError from '../../components/common/FieldError';
import {
  validateName,
  validatePhone,
  validatePassword,
  validatePasswordConfirmation
} from '../../utils/formValidation';

export default function SecurityOfficerProfileView() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
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
    assignedGate: '',
    shiftSchedule: '',
    emergencyContact: '',
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
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const userKey = `user_photo_${user?.id || 'security'}`;
      const savedPhoto = 
        sessionStorage.getItem(userKey) || 
        localStorage.getItem(userKey) || 
        sessionStorage.getItem('security_profile_photo') || 
        localStorage.getItem('security_profile_photo') || 
        user?.avatarUrl || 
        user?.avatar || 
        null;

      const res = await securityApi.getProfile().catch(() => null);
      const backendData = res?.data?.profile || res?.data || {};

      // Strictly real data from database & authenticated session
      const merged = {
        id: user?.id || backendData.id || '',
        badge_number: user?.userCode || backendData.badge_number || backendData.user_code || (user?.id ? `SEC-${user.id}` : ''),
        full_name: user?.fullName || backendData.full_name || `${backendData.first_name || ''} ${backendData.last_name || ''}`.trim() || user?.username || user?.name || '',
        email: user?.email || backendData.email || '',
        phone: user?.phone || backendData.phone || backendData.phone_number || '',
        job_title: backendData.job_title || user?.role_name || user?.role || 'Security Officer',
        department: backendData.department_name || user?.department_name || user?.department || '',
        branch_name: backendData.branch_name || user?.branch_name || user?.branch || '',
        org_name: backendData.org_name || user?.organization_name || user?.organization || '',
        assigned_gate: backendData.assigned_gate || '',
        duty_station: backendData.duty_station || '',
        shift_schedule: backendData.shift_schedule || '',
        security_clearance: backendData.security_clearance || 'Standard Clearance',
        emergency_contact: backendData.emergency_contact || '',
        status: user?.status || backendData.status || 'Active',
        photo_url: savedPhoto || backendData.avatar_url || backendData.photo_url || user?.avatarUrl || user?.avatar || null,
      };

      setProfile(merged);
      setPhotoPreview(merged.photo_url);
      setEditForm({
        fullName: merged.full_name,
        phone: merged.phone,
        assignedGate: merged.assigned_gate,
        shiftSchedule: merged.shift_schedule,
        emergencyContact: merged.emergency_contact,
      });
    } catch (err) {
      console.warn('Error loading security profile:', err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to fetch security profile') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Generate Digital QR Pass
  useEffect(() => {
    if (profile?.badge_number) {
      const payload = [
        `ROLE: SECURITY_OFFICER`,
        `BADGE: ${profile.badge_number}`,
        `NAME: ${profile.full_name}`,
        `POST: ${profile.assigned_gate}`,
        `SHIFT: ${profile.shift_schedule}`,
        `CLEARANCE: ${profile.security_clearance}`,
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
        const userKey = `user_photo_${user?.id || 'security'}`;

        try {
          sessionStorage.setItem(userKey, base64Url);
          localStorage.setItem(userKey, base64Url);
          sessionStorage.setItem('security_profile_photo', base64Url);
          localStorage.setItem('security_profile_photo', base64Url);

          if (updateUser) {
            updateUser({ avatarUrl: base64Url });
          }

          // Real-time event dispatch for Navbar avatar
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('user-profile-updated'));

          // Persist to backend
          await securityApi.updateProfile({ photoUrl: base64Url, avatarUrl: base64Url });
          await authApi.updateProfile({ avatarUrl: base64Url }).catch(() => {});

          setProfile((prev) => ({ ...prev, photo_url: base64Url }));
          setMessage({ type: 'success', text: 'Security officer photo updated and synchronized across system!' });
        } catch (err) {
          console.error(err);
          setMessage({ type: 'error', text: 'Failed to update photo.' });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo Handler
  const handleRemovePhoto = async () => {
    setPhotoPreview(null);
    const userKey = `user_photo_${user?.id || 'security'}`;
    try {
      sessionStorage.removeItem(userKey);
      localStorage.removeItem(userKey);
      sessionStorage.removeItem('security_profile_photo');
      localStorage.removeItem('security_profile_photo');

      if (updateUser) {
        updateUser({ avatarUrl: '' });
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('user-profile-updated'));

      await securityApi.updateProfile({ photoUrl: null, avatarUrl: '' });
      await authApi.updateProfile({ avatarUrl: '' }).catch(() => {});

      setProfile((prev) => ({ ...prev, photo_url: null }));
      setMessage({ type: 'success', text: 'Profile photo removed.' });
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Info Submit Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const newErrs = {};
    const nameErr = validateName(editForm.fullName, 'Full Name', true);
    if (nameErr) newErrs.fullName = nameErr;
    if (editForm.phone) {
      const pErr = validatePhone(editForm.phone, 'Radio Contact / Mobile Phone', false);
      if (pErr) newErrs.phone = pErr;
    }

    if (Object.keys(newErrs).length > 0) {
      setEditErrors(newErrs);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await securityApi.updateProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
        assignedGate: editForm.assignedGate,
        shiftSchedule: editForm.shiftSchedule,
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
        assigned_gate: editForm.assignedGate,
        shift_schedule: editForm.shiftSchedule,
      }));

      setEditErrors({});
      setMessage({ type: 'success', text: 'Security officer details updated successfully!' });
      setActiveTab('overview');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update security profile') });
    } finally {
      setSaving(false);
    }
  };

  // Password Change Handler
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

    setChangingPassword(true);
    setMessage(null);

    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to change password. Please verify current password.') });
    } finally {
      setChangingPassword(false);
    }
  };

  const photoSrc = photoPreview || profile?.photo_url || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard" />
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Security Officer Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                Access Control Authority
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Checkpoint gate assignment, tactical surveillance clearances, and operational contact credentials.
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
            <span>Tactical Security Pass</span>
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

      {/* HERO SECURITY IDENTITY CARD */}
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
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
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
                {profile?.full_name || 'Security Officer'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <BadgeCheck className="h-3 w-3" /> Commissioned Officer
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-indigo-300">
                {profile?.badge_number || 'N/A'}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-300">
              {profile?.job_title || 'Security Officer'} {profile?.department ? `• ${profile.department}` : ''}
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

          {/* Checkpoint Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center md:text-right shrink-0 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
              Checkpoint Post
            </span>
            <div className="text-sm font-black text-emerald-400">
              {profile?.assigned_gate || 'Not Assigned'}
            </div>
            <span className="text-[11px] text-slate-400 block font-medium">
              {profile?.shift_schedule || 'Not Assigned'}
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
          <Crosshair className="h-3.5 w-3.5" />
          <span>Post & Duty Parameters</span>
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
          <span>Edit Officer Profile</span>
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
          {/* Card: Gate & Duty */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <span>Gate & Patrol Post Parameters</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Assigned Checkpoint:</span>
                <span className="font-bold text-white">{profile?.assigned_gate || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Surveillance Base:</span>
                <span className="font-bold text-slate-200">{profile?.duty_station || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Shift Schedule:</span>
                <span className="font-bold text-indigo-400">{profile?.shift_schedule || 'Not scheduled'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Branch Location:</span>
                <span className="font-bold text-slate-200">{profile?.branch_name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Tactical Role:</span>
                <span className="font-bold text-emerald-400">{profile?.job_title || 'Security Officer'}</span>
              </div>
            </div>
          </div>

          {/* Card: Security Clearance & Credentials */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Tactical Clearances & Contacts</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Security Clearance:</span>
                <span className="font-bold text-indigo-300">{profile?.security_clearance || 'Standard'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Official Radio/Phone:</span>
                <span className="font-bold text-white">{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Official Dispatch Email:</span>
                <span className="font-mono text-slate-200">{profile?.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">SOC Emergency Dispatch:</span>
                <span className="font-bold text-slate-300">{profile?.emergency_contact || 'None'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Duty Status:</span>
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
              Edit Officer Contact Information
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update radio numbers, gate checkpoint post, and emergency contacts.
            </p>
          </div>

          <form onSubmit={handleEditSubmit} noValidate className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editForm.fullName}
                data-invalid={Boolean(editErrors.fullName)}
                aria-invalid={Boolean(editErrors.fullName)}
                onChange={(e) => {
                  setEditForm((f) => ({ ...f, fullName: e.target.value }));
                  clearEditError('fullName');
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                  editErrors.fullName ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                }`}
              />
              <FieldError error={editErrors.fullName} />
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
                  Radio Contact / Mobile Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  data-invalid={Boolean(editErrors.phone)}
                  aria-invalid={Boolean(editErrors.phone)}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, phone: e.target.value }));
                    clearEditError('phone');
                  }}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                    editErrors.phone ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                  }`}
                />
                <FieldError error={editErrors.phone} />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider block">
                  Assigned Gate Checkpoint
                </label>
                <input
                  type="text"
                  value={editForm.assignedGate}
                  onChange={(e) => setEditForm((f) => ({ ...f, assignedGate: e.target.value }))}
                  placeholder="Gate 1 — Main Vehicle & Pedestrian Portal"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Emergency Dispatch Number
              </label>
              <input
                type="text"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                placeholder="+1 (555) 019-9110"
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
              Security Officer Portrait Photo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload an official uniform portrait. Displayed in the system navbar, gate access logs, and security passes.
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
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
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
              Secure your security portal credentials with a strong password.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                data-invalid={Boolean(passwordErrors.currentPassword)}
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                onChange={(e) => {
                  setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }));
                  clearPasswordError('currentPassword');
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                  passwordErrors.currentPassword ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                }`}
              />
              <FieldError error={passwordErrors.currentPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                New Password * (Min 8 chars, mixed case & numbers)
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                data-invalid={Boolean(passwordErrors.newPassword)}
                aria-invalid={Boolean(passwordErrors.newPassword)}
                onChange={(e) => {
                  setPasswordForm((f) => ({ ...f, newPassword: e.target.value }));
                  clearPasswordError('newPassword');
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                  passwordErrors.newPassword ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                }`}
              />
              <FieldError error={passwordErrors.newPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                data-invalid={Boolean(passwordErrors.confirmPassword)}
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                onChange={(e) => {
                  setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }));
                  clearPasswordError('confirmPassword');
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl text-white focus:outline-none transition-all ${
                  passwordErrors.confirmPassword ? 'border-2 border-rose-500 bg-rose-950/20' : 'border border-slate-800 focus:border-indigo-500'
                }`}
              />
              <FieldError error={passwordErrors.confirmPassword} />
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
                Tactical Security Pass
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
                Access Control & Security Authority
              </div>
              <h4 className="text-base font-black text-slate-900">{profile?.full_name}</h4>
              <p className="text-[11px] font-mono font-bold text-indigo-600">{profile?.badge_number}</p>

              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Badge QR"
                  className="w-48 h-48 mx-auto rounded-xl border border-slate-200"
                />
              )}

              <div className="text-[10px] font-bold text-slate-600">
                {profile?.assigned_gate} • {profile?.shift_schedule}
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
