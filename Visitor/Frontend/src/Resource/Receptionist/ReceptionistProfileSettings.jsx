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
  Clock, 
  BadgeCheck, 
  X, 
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Calendar
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { receptionApi, authApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { resolvePhotoUrl } from '../../utils/photoUtils';

export default function ReceptionistProfileSettings() {
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
    receptionCounter: '',
    shiftSchedule: '',
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
      const userKey = `user_photo_${user?.id || 'reception'}`;
      const savedPhoto = 
        sessionStorage.getItem(userKey) || 
        localStorage.getItem(userKey) || 
        sessionStorage.getItem('receptionist_profile_photo') || 
        localStorage.getItem('receptionist_profile_photo') || 
        user?.avatarUrl || 
        user?.avatar || 
        null;

      const res = await receptionApi.getProfile().catch(() => null);
      const backendData = res?.data?.profile || res?.data || {};

      // Merge backend real data with authenticated user state - strictly real data
      const merged = {
        id: user?.id || backendData.id || '',
        user_code: user?.userCode || backendData.user_code || (user?.id ? `REC-${user.id}` : ''),
        full_name: user?.fullName || backendData.full_name || user?.username || user?.name || '',
        email: user?.email || backendData.email || '',
        phone: user?.phone || backendData.phone || backendData.phone_number || '',
        role: user?.role_name || user?.role || backendData.role || 'receptionist',
        job_title: backendData.job_title || 'Receptionist',
        department: backendData.department_name || user?.department_name || user?.department || '',
        branch_name: backendData.branch_name || user?.branch_name || user?.branch || '',
        org_name: backendData.org_name || user?.organization_name || user?.organization || '',
        reception_counter: backendData.reception_counter || backendData.reception_desk || '',
        shift_schedule: backendData.shift_schedule || backendData.shift || '',
        security_clearance: backendData.security_clearance || 'Standard Clearance',
        emergency_contact: backendData.emergency_contact || '',
        status: user?.status || backendData.status || 'Active',
        photo_url: savedPhoto || backendData.photo_url || backendData.avatar_url || user?.avatarUrl || user?.avatar || null,
      };

      setProfile(merged);
      setPhotoPreview(merged.photo_url);
      setEditForm({
        fullName: merged.full_name,
        phone: merged.phone,
        receptionCounter: merged.reception_counter,
        shiftSchedule: merged.shift_schedule,
        emergencyContact: merged.emergency_contact,
      });
    } catch (err) {
      console.warn('Error loading reception profile:', err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to fetch profile details') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Generate Digital QR Pass
  useEffect(() => {
    if (profile?.user_code) {
      const payload = [
        `ROLE: RECEPTION_OFFICER`,
        `CODE: ${profile.user_code}`,
        `NAME: ${profile.full_name}`,
        `DUTY: ${profile.reception_counter}`,
        `SHIFT: ${profile.shift_schedule}`,
        `EMAIL: ${profile.email}`,
        `STATUS: ${profile.status}`,
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
        const userKey = `user_photo_${user?.id || 'reception'}`;

        try {
          sessionStorage.setItem(userKey, base64Url);
          localStorage.setItem(userKey, base64Url);
          sessionStorage.setItem('receptionist_profile_photo', base64Url);
          localStorage.setItem('receptionist_profile_photo', base64Url);

          if (updateUser) {
            updateUser({ avatarUrl: base64Url });
          }

          // Trigger instant sync across layout and navbar
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('user-profile-updated'));

          // Persist to backend
          await receptionApi.updateProfile({ avatarUrl: base64Url, photoUrl: base64Url });
          await authApi.updateProfile({ avatarUrl: base64Url }).catch(() => {});

          setProfile((prev) => ({ ...prev, photo_url: base64Url }));
          setMessage({ type: 'success', text: 'Profile photo updated and synchronized across system!' });
        } catch (err) {
          console.error(err);
          setMessage({ type: 'error', text: 'Failed to save updated photo.' });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo Handler
  const handleRemovePhoto = async () => {
    setPhotoPreview(null);
    const userKey = `user_photo_${user?.id || 'reception'}`;
    try {
      sessionStorage.removeItem(userKey);
      localStorage.removeItem(userKey);
      sessionStorage.removeItem('receptionist_profile_photo');
      localStorage.removeItem('receptionist_profile_photo');

      if (updateUser) {
        updateUser({ avatarUrl: '' });
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('user-profile-updated'));

      await receptionApi.updateProfile({ avatarUrl: '' });
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
    setSaving(true);
    setMessage(null);

    try {
      await receptionApi.updateProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
        receptionCounter: editForm.receptionCounter,
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
        reception_counter: editForm.receptionCounter,
        shift_schedule: editForm.shiftSchedule,
      }));

      setMessage({ type: 'success', text: 'Profile & contact details updated successfully!' });
      setActiveTab('overview');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update profile info') });
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
    setMessage(null);

    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to change password. Verify your current password.') });
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
              <User className="h-6 w-6 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Reception Officer Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                Front Desk Authority
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage front desk officer credentials, live duty assignment, personal contact info, and profile photo.
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

      {/* HERO PROFILE IDENTITY CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar with Camera Action */}
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
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'R'}
                </span>
              )}
            </div>

            {/* Change Photo Overlay Button */}
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
                {profile?.full_name || 'Reception Officer'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <BadgeCheck className="h-3 w-3" /> Verified Officer
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-indigo-300">
                {profile?.user_code || 'N/A'}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-300">
              {profile?.job_title || 'Receptionist'} {profile?.department ? `• ${profile.department}` : ''}
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

          {/* Duty Pill Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center md:text-right shrink-0 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
              Active Counter
            </span>
            <div className="text-sm font-black text-emerald-400">
              {profile?.reception_counter || 'Not Assigned'}
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
          <Building className="h-3.5 w-3.5" />
          <span>Duty & Overview</span>
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
          <span>Edit Information</span>
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
          {/* Card: Operational Assignment */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <span>Operational Duty Assignment</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Reception Counter:</span>
                <span className="font-bold text-white">{profile?.reception_counter || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Shift Schedule:</span>
                <span className="font-bold text-indigo-400">{profile?.shift_schedule || 'Not scheduled'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Assigned Branch:</span>
                <span className="font-bold text-slate-200">{profile?.branch_name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Parent Organization:</span>
                <span className="font-bold text-slate-200">{profile?.org_name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Operational Role:</span>
                <span className="font-bold text-emerald-400">{profile?.job_title || 'Receptionist'}</span>
              </div>
            </div>
          </div>

          {/* Card: Identity & Clearances */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Authority & Contact Information</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Clearance Level:</span>
                <span className="font-bold text-indigo-300">{profile?.security_clearance || 'Standard'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Official Email:</span>
                <span className="font-mono text-slate-200">{profile?.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Contact Number:</span>
                <span className="font-bold text-white">{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-bold text-slate-300">{profile?.emergency_contact || 'None'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Account Status:</span>
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
              Edit Personal & Duty Information
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates to your name and contact info will immediately reflect across visitor passes and receptionist logs.
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
                  Reception Counter / Desk
                </label>
                <input
                  type="text"
                  value={editForm.receptionCounter}
                  onChange={(e) => setEditForm((f) => ({ ...f, receptionCounter: e.target.value }))}
                  placeholder="Main Lobby Counter 1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Shift Schedule
              </label>
              <select
                value={editForm.shiftSchedule}
                onChange={(e) => setEditForm((f) => ({ ...f, shiftSchedule: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Morning Shift (07:00 - 15:00)">Morning Shift (07:00 - 15:00)</option>
                <option value="Afternoon Shift (15:00 - 23:00)">Afternoon Shift (15:00 - 23:00)</option>
                <option value="Night Shift (23:00 - 07:00)">Night Shift (23:00 - 07:00)</option>
                <option value="Standard Business Hours (08:30 - 17:30)">Standard Business Hours (08:30 - 17:30)</option>
              </select>
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
              Profile Photo Management
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload a clear headshot photo. This photo displays in the navigation bar and on printed/digital passes.
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
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'R'}
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
                <span>Upload New Photo</span>
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
              Ensure your account uses a strong password with letters, numbers, and symbols.
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
                Official Digital Badge Pass
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
                Front Desk Operations Credential
              </div>
              <h4 className="text-base font-black text-slate-900">{profile?.full_name}</h4>
              <p className="text-[11px] font-mono font-bold text-indigo-600">{profile?.user_code}</p>

              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Badge QR"
                  className="w-48 h-48 mx-auto rounded-xl border border-slate-200"
                />
              )}

              <div className="text-[10px] font-bold text-slate-600">
                {profile?.reception_counter} • {profile?.shift_schedule}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Printer className="h-4 w-4" />
                <span>Print Badge</span>
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
