import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Building, Shield, Camera, Upload, Check, AlertCircle, X, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi, getErrorMessage } from '../../services/api';
import CountryPhoneInput from '../common/CountryPhoneInput';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    company: '',
    idType: '',
    idNumber: '',
    avatarUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize form with authenticated user data
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      if (user) {
        setFormData({
          fullName: user.fullName || user.full_name || '',
          phone: user.phone || user.phone_number || '',
          company: user.company || '',
          idType: user.idType || user.id_type || 'NATIONAL_ID',
          idNumber: user.idNumber || user.id_number || '',
          avatarUrl: user.avatarUrl || user.avatar || user.profile_photo || ''
        });
      }

      // Fetch fresh profile data from MySQL
      profileApi.getProfile()
        .then(res => {
          const data = res.data;
          if (data) {
            setFormData(prev => ({
              ...prev,
              fullName: data.fullName || data.full_name || prev.fullName,
              phone: data.phone || data.phone_number || prev.phone,
              company: data.company || prev.company,
              idType: data.idType || data.id_type || prev.idType,
              idNumber: data.idNumber || data.id_number || prev.idNumber,
              avatarUrl: data.avatarUrl || data.avatar || data.profile_photo || prev.avatarUrl
            }));
          }
        })
        .catch(err => {
          console.warn('Could not fetch fresh profile, using cached session:', err);
        });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setStatusMessage({ type: 'error', text: 'Please upload a valid image file (JPEG, PNG, WEBP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Avatar file size must be less than 2MB.' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setStatusMessage(null);
      const data = new FormData();
      data.append('avatar', file);

      const res = await profileApi.uploadAvatar(data);
      const newAvatarUrl = res.data.avatarUrl;
      setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));

      if (user) {
        updateUser({ ...user, avatarUrl: newAvatarUrl, avatar: newAvatarUrl });
        window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: { avatarUrl: newAvatarUrl } }));
      }

      setStatusMessage({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err) || 'Failed to upload photo.' });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setStatusMessage({ type: 'error', text: 'Full Name is required.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        avatarUrl: formData.avatarUrl,
      };

      if (user?.role?.toLowerCase() === 'visitor') {
        payload.company = formData.company.trim();
        payload.idType = formData.idType;
        payload.idNumber = formData.idNumber.trim();
      }

      const res = await profileApi.updateProfile(payload);
      const updatedData = res.data?.data || res.data;

      // Update AuthContext user state immediately
      if (user) {
        const updatedUser = {
          ...user,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          avatarUrl: formData.avatarUrl,
          ...(updatedData && typeof updatedData === 'object' ? updatedData : {})
        };
        updateUser(updatedUser);
        window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));
      }

      setStatusMessage({ type: 'success', text: 'Profile updated and saved to database successfully!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err) || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const role = user?.role || 'User';
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
  const userCode = user?.userCode || user?.user_code || `USR-${user?.id || '001'}`;
  const isVisitor = role.toLowerCase() === 'visitor';

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Profile</h2>
              <p className="text-[11px] text-slate-400">Update your account information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Avatar Upload Section */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg uppercase bg-indigo-950/40 text-indigo-300">
                  {formData.fullName ? formData.fullName.charAt(0) : 'U'}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Profile Photo</p>
              <p className="text-[11px] text-slate-400 mb-2">PNG, JPG or WEBP (max 2MB)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload New</span>
              </button>
            </div>
          </div>

          {/* Read-Only Protected Badges */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-800/40">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> System Role
              </span>
              <p className="text-xs font-semibold text-indigo-400 mt-0.5">{roleDisplay}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> User Code
              </span>
              <p className="text-xs font-mono font-semibold text-slate-300 mt-0.5">{userCode}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address <span className="text-[10px] text-slate-500">(Protected)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <CountryPhoneInput
                id="profile-phone-input"
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>

            {/* Visitor Specific Fields */}
            {isVisitor && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Company name"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      ID Type
                    </label>
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="NATIONAL_ID">National ID</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      ID Number
                    </label>
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                      placeholder="ID number"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingAvatar}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
