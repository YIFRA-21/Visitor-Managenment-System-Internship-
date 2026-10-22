import React, { useState, useEffect } from 'react';
import { 
  X, User, MapPin, Phone, Shield, FileText, Upload, Check, AlertCircle, Save, 
  Briefcase, Building, Clock, Calendar, CheckCircle2 
} from 'lucide-react';
import { visitorPortalApi, authApi } from '../../../services/api';
import { resolvePhotoUrl } from '../../../utils/photoUtils';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import CountryPhoneInput from '../../../components/common/CountryPhoneInput';
import CountryNationalitySelect from '../../../components/common/CountryNationalitySelect';

export default function AddOtherVisitorInfoModal({ isOpen, onClose, onSuccess, initialData = {} }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Active Navigation Tab
  const [activeSection, setActiveSection] = useState('category');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. VISITOR CATEGORY & VISIT / ORGANIZATION DETAILS
  const [category, setCategory] = useState('General Visitor');
  const [company, setCompany] = useState('');
  const [hostName, setHostName] = useState('');
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('Head Office / Main HQ');
  const [location, setLocation] = useState('Main Entrance Desk');
  const [duration, setDuration] = useState('60');
  const [purpose, setPurpose] = useState('');

  // 2. ADDRESS DETAILS
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [subcity, setSubcity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('Ethiopia');
  const [postalCode, setPostalCode] = useState('');

  // 3. PERSONAL & CONTACT DETAILS
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState('Email');

  // 4. IDENTIFICATION & PHOTO
  const [identityType, setIdentityType] = useState('National ID');
  const [identityNumber, setIdentityNumber] = useState('');
  const [idIssueDate, setIdIssueDate] = useState('');
  const [idExpiryDate, setIdExpiryDate] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  // 5. EMERGENCY CONTACT DETAILS
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [secondaryEmergencyPhone, setSecondaryEmergencyPhone] = useState('');

  // Pre-fill all fields on modal opening from all available sources
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setSuccessMsg('');

    // Gather sources in order of preference
    let activeProfile = {};
    let regData = {};
    let signupInfo = {};
    let storedUser = user || {};

    try {
      const aRaw = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
      if (aRaw) activeProfile = JSON.parse(aRaw);
    } catch {}

    try {
      const rRaw = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
      if (rRaw) regData = JSON.parse(rRaw);
    } catch {}

    try {
      const sRaw = sessionStorage.getItem('signup_personal_info') || localStorage.getItem('signup_personal_info');
      if (sRaw) signupInfo = JSON.parse(sRaw);
    } catch {}

    try {
      const uRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (uRaw) storedUser = { ...storedUser, ...JSON.parse(uRaw) };
    } catch {}

    // Merge helper with fallback chains
    const getVal = (...keys) => {
      for (const k of keys) {
        if (initialData && initialData[k] !== undefined && initialData[k] !== null && initialData[k] !== '' && initialData[k] !== '—' && initialData[k] !== '-') {
          return initialData[k];
        }
        if (activeProfile && activeProfile[k] !== undefined && activeProfile[k] !== null && activeProfile[k] !== '' && activeProfile[k] !== '—' && activeProfile[k] !== '-') {
          return activeProfile[k];
        }
        if (regData && regData[k] !== undefined && regData[k] !== null && regData[k] !== '' && regData[k] !== '—' && regData[k] !== '-') {
          return regData[k];
        }
        if (signupInfo && signupInfo[k] !== undefined && signupInfo[k] !== null && signupInfo[k] !== '' && signupInfo[k] !== '—' && signupInfo[k] !== '-') {
          return signupInfo[k];
        }
        if (storedUser && storedUser[k] !== undefined && storedUser[k] !== null && storedUser[k] !== '' && storedUser[k] !== '—' && storedUser[k] !== '-') {
          return storedUser[k];
        }
      }
      return '';
    };

    // Category & Visit
    setCategory(getVal('category', 'visitor_category') || 'General Visitor');
    setCompany(getVal('company', 'visitor_company', 'visitorCompany') || '');
    setHostName(getVal('hostName', 'host_employee_name', 'host_name', 'host') || '');
    setDepartment(getVal('department', 'department_name', 'departmentName', 'hostDepartment') || '');
    setBranch(getVal('branch', 'branch_name', 'branchName') || 'Head Office / Main HQ');
    setLocation(getVal('location', 'meeting_location', 'meetingLocation') || 'Main Entrance Desk');
    setDuration(String(getVal('duration', 'visit_duration', 'visit_duration_minutes') || '60'));
    setPurpose(getVal('purpose', 'visit_purpose', 'visitPurpose', 'purposeOfVisit') || '');

    // Address
    setStreetAddress(getVal('streetAddress', 'street_address', 'address') || '');
    setCity(getVal('city') || 'Addis Ababa');
    setSubcity(getVal('subcity', 'sub_city', 'woreda') || '');
    setStateProvince(getVal('stateProvince', 'state_province', 'region') || '');
    setCountry(getVal('country') || 'Ethiopia');
    setPostalCode(getVal('postalCode', 'postal_code') || '');

    // Personal & Names
    const rawFullName = getVal('fullName', 'full_name', 'visitorName', 'name') || '';
    const nameParts = rawFullName ? rawFullName.trim().split(/\s+/) : [];
    setFirstName(getVal('firstName', 'first_name') || (nameParts[0] || ''));
    setMiddleName(getVal('middleName', 'middle_name') || (nameParts[1] || ''));
    setLastName(getVal('lastName', 'last_name') || (nameParts.length > 2 ? nameParts.slice(2).join(' ') : (nameParts[1] ? '' : '')));
    setPhone(getVal('phone', 'visitor_phone', 'mobile_number') || '');
    setEmail(getVal('email', 'visitor_email') || '');
    setWorkEmail(getVal('workEmail', 'work_email') || '');
    setAltPhone(getVal('altPhone', 'alternative_phone', 'alt_phone', 'secondary_phone') || '');
    setPreferredContact(getVal('preferredContact', 'preferred_contact_method') || 'Email');

    // Identity & Photo
    setIdentityType(getVal('identityType', 'id_type', 'idType') || 'National ID');
    setIdentityNumber(getVal('identityNumber', 'id_number', 'idNumber') || '');
    setIdIssueDate(getVal('idIssueDate', 'id_issue_date') || '');
    setIdExpiryDate(getVal('idExpiryDate', 'id_expiry_date') || '');

    const foundPhoto = getVal('photoUrl', 'photo_url', 'avatarUrl', 'profile_photo', 'avatar') ||
      sessionStorage.getItem('visitor_uploaded_photo') ||
      localStorage.getItem('visitor_uploaded_photo');
    if (foundPhoto) setPhotoPreview(foundPhoto);

    // Emergency
    setEmergencyName(getVal('emergencyName', 'emergency_contact_name', 'emergencyContactName') || '');
    setEmergencyRelation(getVal('emergencyRelation', 'emergency_relationship', 'emergencyRelationship') || 'Spouse');
    setEmergencyPhone(getVal('emergencyPhone', 'emergency_contact_phone', 'emergencyContactPhone') || '');
    setSecondaryEmergencyPhone(getVal('secondaryEmergencyPhone', 'secondary_emergency_phone') || '');

    // Try fetching fresh profile from backend
    visitorPortalApi.getProfile()
      .then((res) => {
        const p = res?.data || res;
        if (p) {
          if (p.category) setCategory(p.category);
          if (p.company) setCompany(p.company);
          if (p.department_name) setDepartment(p.department_name);
          if (p.branch_name) setBranch(p.branch_name);
          if (p.host_employee_name) setHostName(p.host_employee_name);
          if (p.meeting_location) setLocation(p.meeting_location);
          if (p.visit_duration) setDuration(String(p.visit_duration));
          if (p.visit_purpose) setPurpose(p.visit_purpose);
          if (p.address) setStreetAddress(p.address);
          if (p.city) setCity(p.city);
          if (p.sub_city) setSubcity(p.sub_city);
          if (p.region) setStateProvince(p.region);
          if (p.country) setCountry(p.country);
          if (p.postal_code) setPostalCode(p.postal_code);
          if (p.first_name) setFirstName(p.first_name);
          if (p.middle_name) setMiddleName(p.middle_name);
          if (p.last_name) setLastName(p.last_name);
          if (p.phone) setPhone(p.phone);
          if (p.email) setEmail(p.email);
          if (p.id_type) setIdentityType(p.id_type);
          if (p.id_number) setIdentityNumber(p.id_number);
          if (p.emergency_contact_name) setEmergencyName(p.emergency_contact_name);
          if (p.emergency_contact_phone) setEmergencyPhone(p.emergency_contact_phone);
          if (p.photo_url) setPhotoPreview(p.photo_url);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await authApi.uploadAvatar(formData);
        const serverUrl = res.data?.avatarUrl;
        if (serverUrl) {
          setPhotoPreview(serverUrl);
          sessionStorage.setItem('visitor_uploaded_photo', serverUrl);
          localStorage.setItem('visitor_uploaded_photo', serverUrl);
          return;
        }
      } catch (err) {}

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setPhotoPreview(dataUrl);
        sessionStorage.setItem('visitor_uploaded_photo', dataUrl);
        localStorage.setItem('visitor_uploaded_photo', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit & Save All Profile Information
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const resolvedFullName = `${firstName || ''} ${middleName || ''} ${lastName || ''}`.replace(/\s+/g, ' ').trim() || (user?.fullName || user?.full_name || 'Visitor');
    const fullAddress = `${streetAddress}${subcity ? ', ' + subcity : ''}, ${city}, ${country}`.replace(/^,\s*/, '');

    const payload = {
      // 1. Visitor Category & Visit Information
      category,
      visitor_category: category,
      visitorCategory: category,
      company,
      visitor_company: company,
      visitorCompany: company,
      host_employee_name: hostName,
      hostName,
      host_name: hostName,
      host: hostName,
      department_name: department,
      departmentName: department,
      department,
      branch_name: branch,
      branchName: branch,
      branch,
      meeting_location: location,
      meetingLocation: location,
      location,
      visit_duration: parseInt(duration, 10) || 60,
      visit_duration_minutes: parseInt(duration, 10) || 60,
      duration: parseInt(duration, 10) || 60,
      visit_purpose: purpose,
      visitPurpose: purpose,
      purpose,

      // 2. Address Details
      address: fullAddress,
      street_address: streetAddress,
      streetAddress,
      city,
      subcity,
      sub_city: subcity,
      state_province: stateProvince,
      region: stateProvince,
      country,
      postal_code: postalCode,
      postalCode,

      // 3. Personal & Contact
      first_name: firstName,
      firstName,
      middle_name: middleName,
      middleName,
      last_name: lastName,
      lastName,
      full_name: resolvedFullName,
      fullName: resolvedFullName,
      visitorName: resolvedFullName,
      phone,
      email,
      work_email: workEmail,
      workEmail,
      alternative_phone: altPhone,
      altPhone,
      preferred_contact_method: preferredContact,
      preferredContact,

      // 4. Identification & Photo
      id_type: identityType,
      idType: identityType,
      identity_type: identityType,
      identityType,
      id_number: identityNumber,
      idNumber: identityNumber,
      identity_number: identityNumber,
      identityNumber,
      id_issue_date: idIssueDate,
      idIssueDate,
      id_expiry_date: idExpiryDate,
      idExpiryDate,
      photo_url: photoPreview,
      photoUrl: photoPreview,
      avatarUrl: photoPreview,
      profile_photo: photoPreview,

      // 5. Emergency Contact
      emergency_contact_name: emergencyName,
      emergencyContactName: emergencyName,
      emergencyName,
      emergency_relationship: emergencyRelation,
      emergencyRelationship: emergencyRelation,
      emergencyRelation,
      emergency_phone: emergencyPhone,
      emergencyContactPhone: emergencyPhone,
      emergencyPhone,
      secondary_emergency_phone: secondaryEmergencyPhone,
      secondaryEmergencyPhone
    };

    // 1. Call Backend API
    try {
      await visitorPortalApi.updateProfile(payload);
    } catch (err) {
      console.warn('Backend updateProfile fallback note:', err);
    }

    // 2. Synchronize Storage (active_visitor_profile, registered_visitor_data, signup_personal_info, user)
    try {
      const existing = JSON.parse(sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile') || '{}');
      const uRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
      const uObj = uRaw ? JSON.parse(uRaw) : {};

      const updatedProfile = {
        ...existing,
        ...payload,
        updatedAt: new Date().toISOString()
      };

      sessionStorage.setItem('active_visitor_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('active_visitor_profile', JSON.stringify(updatedProfile));

      // Sync registered_visitor_data
      const regRaw = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
      const regObj = regRaw ? JSON.parse(regRaw) : {};
      const updatedReg = {
        ...regObj,
        ...payload,
        visitorName: resolvedFullName,
        fullName: resolvedFullName,
        company,
        category,
        identityType,
        identityNumber,
        photoUrl: photoPreview,
        photo_url: photoPreview
      };
      sessionStorage.setItem('registered_visitor_data', JSON.stringify(updatedReg));
      localStorage.setItem('registered_visitor_data', JSON.stringify(updatedReg));

      // Sync signup_personal_info
      const signupUpdated = {
        firstName,
        middleName,
        lastName,
        fullName: resolvedFullName,
        phone,
        email,
        company,
        category,
        idType: identityType,
        idNumber: identityNumber,
        photoUrl: photoPreview
      };
      sessionStorage.setItem('signup_personal_info', JSON.stringify(signupUpdated));
      localStorage.setItem('signup_personal_info', JSON.stringify(signupUpdated));

      // Sync user object
      uObj.fullName = resolvedFullName;
      uObj.full_name = resolvedFullName;
      uObj.firstName = firstName;
      uObj.first_name = firstName;
      uObj.lastName = lastName;
      uObj.last_name = lastName;
      uObj.phone = phone;
      uObj.company = company;
      uObj.category = category;
      if (photoPreview) {
        uObj.avatarUrl = photoPreview;
        uObj.profile_photo = photoPreview;
        sessionStorage.setItem('visitor_uploaded_photo', photoPreview);
        localStorage.setItem('visitor_uploaded_photo', photoPreview);
      }
      localStorage.setItem('user', JSON.stringify(uObj));
      sessionStorage.setItem('user', JSON.stringify(uObj));

      // Append / Update vms_history_appointments so history table reflects changes immediately
      const historyList = JSON.parse(localStorage.getItem('vms_history_appointments') || '[]');
      const newAuditRecord = {
        id: `HIST-${Date.now().toString().slice(-6)}`,
        historyCode: `UPD-${Date.now().toString().slice(-5)}`,
        referenceNumber: updatedProfile.referenceNumber || updatedReg.referenceNumber || 'REF-REG-2026',
        visitorName: resolvedFullName,
        company: company,
        category: category,
        identityNumber: identityNumber || '—',
        identityType: identityType || '—',
        hostName: hostName || 'General Staff',
        department: department || 'Operations',
        branch: branch || 'Head Office / Main HQ',
        location: location || 'Main Entrance Desk',
        appointmentNumber: 'SYS-PROFILE-UPDATE',
        purpose: purpose || 'Visitor Profile & Category Info Updated',
        duration: parseInt(duration, 10) || 60,
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOutTime: '—',
        status: 'Completed',
        email: email || uObj.email,
        phone: phone || uObj.phone,
        photoUrl: photoPreview
      };
      historyList.unshift(newAuditRecord);
      localStorage.setItem('vms_history_appointments', JSON.stringify(historyList));

      // Trigger multi-window and cross-component updates
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('user_updated', { detail: { ...payload, avatarUrl: photoPreview } }));
      window.dispatchEvent(new Event('appointment_updated'));

      setSuccessMsg(t('visitor.profileSaved', 'Visitor profile, category, and address information saved successfully!'));
      setTimeout(() => {
        if (onSuccess) onSuccess(updatedProfile);
        onClose();
      }, 700);
    } catch (e) {
      console.error('Error saving visitor profile:', e);
      setErrorMsg('Failed to save profile information. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 text-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 my-6 sm:my-8 animate-fadeIn">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {t('visitor.addUpdateTitle', 'Visitor Profile & Appointment Info')}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {category}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Update visitor category, address, company, host, branch, and personal credentials.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-950/60 no-scrollbar">
          <button 
            type="button" 
            onClick={() => setActiveSection('category')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeSection === 'category'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" /> 
            {t('visitor.tabCategoryVisit', 'Category & Visit Details')}
          </button>

          <button 
            type="button" 
            onClick={() => setActiveSection('address')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeSection === 'address'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> 
            {t('visitor.tabAddress', 'Address Info')}
          </button>

          <button 
            type="button" 
            onClick={() => setActiveSection('personal')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeSection === 'personal'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Phone className="h-3.5 w-3.5" /> 
            {t('visitor.tabPersonal', 'Personal & Contact')}
          </button>

          <button 
            type="button" 
            onClick={() => setActiveSection('identity')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeSection === 'identity'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> 
            {t('visitor.tabIdPhoto', 'ID & Photo')}
          </button>

          <button 
            type="button" 
            onClick={() => setActiveSection('emergency')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeSection === 'emergency'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> 
            {t('visitor.tabEmergency', 'Emergency')}
          </button>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[68vh] overflow-y-auto">

          {/* ══════════════ SECTION 1: CATEGORY & VISIT / ORGANIZATION DETAILS ══════════════ */}
          {activeSection === 'category' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <span className="font-black block mb-0.5 text-blue-300">Category & Organizational Profile</span>
                Configure your visitor classification, organization name, host employee, and visit preferences.
              </div>

              {/* Visitor Category & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.visitorCategory', 'Visitor Category')} *
                  </label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    <option value="General Visitor">General Visitor</option>
                    <option value="Business Visitor">Business Visitor</option>
                    <option value="Contractor">Contractor / Technician</option>
                    <option value="VIP / Executive">VIP / Executive Dignitary</option>
                    <option value="Vendor / Supplier">Vendor / Supplier Representative</option>
                    <option value="Government Official">Government / Diplomatic Official</option>
                    <option value="Job Applicant / Interviewee">Job Applicant / Interviewee</option>
                    <option value="Client / Customer">Client / Customer</option>
                    <option value="Guest">Guest / Personal Visit</option>
                    <option value="Student / Intern">Student / Intern</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.company', 'Company / Employer Name')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ethiopian Tech Corp / Self-Employed" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={company} 
                    onChange={e => setCompany(e.target.value)}
                  />
                </div>
              </div>

              {/* Host Employee & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.hostEmployee', 'Host / Employee Name')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Abebe Bekele / Staff Member" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={hostName} 
                    onChange={e => setHostName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.department', 'Host Department')}
                  </label>
                  <input 
                    type="text" 
                    list="dept-list-options"
                    placeholder="e.g. Information Technology / Operations" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={department} 
                    onChange={e => setDepartment(e.target.value)}
                  />
                  <datalist id="dept-list-options">
                    <option value="Executive Office" />
                    <option value="Information Technology" />
                    <option value="Human Resources" />
                    <option value="Finance & Accounting" />
                    <option value="Operations" />
                    <option value="Sales & Marketing" />
                    <option value="Security Operations" />
                    <option value="Legal & Compliance" />
                    <option value="Customer Relations" />
                  </datalist>
                </div>
              </div>

              {/* Branch / Campus & Meeting Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.branch', 'Branch / Campus')}
                  </label>
                  <input 
                    type="text" 
                    list="branch-list-options"
                    placeholder="e.g. Head Office / Main HQ" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={branch} 
                    onChange={e => setBranch(e.target.value)}
                  />
                  <datalist id="branch-list-options">
                    <option value="Head Office / Main HQ" />
                    <option value="Megenagna Branch" />
                    <option value="Debre Berhan Branch" />
                    <option value="Tulu Dimtu Branch" />
                    <option value="Addis Ababa Campus" />
                    <option value="Bole Regional Center" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.location', 'Meeting Location / Access Gate')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Main Entrance Desk / Tower B, 3rd Floor" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration & Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.duration', 'Expected Duration')}
                  </label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={duration} 
                    onChange={e => setDuration(e.target.value)}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 Hour)</option>
                    <option value="90">90 minutes (1.5 Hours)</option>
                    <option value="120">120 minutes (2 Hours)</option>
                    <option value="240">240 minutes (Half Day)</option>
                    <option value="480">480 minutes (Full Day)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.purpose', 'Visit Purpose / Mission')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Official Business Meeting / Technical Consultation" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={purpose} 
                    onChange={e => setPurpose(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SECTION 2: ADDRESS INFORMATION ══════════════ */}
          {activeSection === 'address' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <span className="font-black block mb-0.5 text-blue-300">Residential & Official Address</span>
                Fill in your current residential or official physical address details for identity validation.
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                  {t('form.address', 'Street Address / House Number')}
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Bole Road, House #402 / Main Ave" 
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                  value={streetAddress} 
                  onChange={e => setStreetAddress(e.target.value)}
                />
              </div>

              {/* City & Subcity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.city', 'City / Town')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Addis Ababa" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.subcity', 'Subcity / District / Woreda')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Kirkos Subcity, Woreda 04" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={subcity} 
                    onChange={e => setSubcity(e.target.value)}
                  />
                </div>
              </div>

              {/* State/Province, Country & Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.state', 'State / Province / Region')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Oromia / Shewa / Region" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={stateProvince} 
                    onChange={e => setStateProvince(e.target.value)}
                  />
                </div>

                <div>
                  <CountryNationalitySelect
                    id="visitor-address-country"
                    name="address_country"
                    label={t('form.country', 'Country')}
                    value={country}
                    returnMode="country"
                    onChange={val => {
                      const cName = typeof val === 'object' ? (val.target?.value || val.name || val.country) : val;
                      setCountry(cName || 'Ethiopia');
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.postalCode', 'Postal / Zip Code')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1000" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={postalCode} 
                    onChange={e => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SECTION 3: PERSONAL & CONTACT DETAILS ══════════════ */}
          {activeSection === 'personal' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <span className="font-black block mb-0.5 text-blue-300">Personal & Primary Contact</span>
                Update your legal full name, primary phone number, and official correspondence channels.
              </div>

              {/* Three-part Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.firstName', 'First Name')} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="First Name" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.middleName', 'Middle / Father Name')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Middle Name" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={middleName} 
                    onChange={e => setMiddleName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.lastName', 'Last / Grandfather Name')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Last Name" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CountryPhoneInput
                    id="visitor-profile-phone"
                    label={t('form.phone', 'Primary Phone Number')}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.email', 'Primary Email Address')} *
                  </label>
                  <input 
                    type="email" 
                    placeholder="visitor.email@example.com" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Work Email, Alt Phone & Preferred Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.workEmail', 'Work Email Address')}
                  </label>
                  <input 
                    type="email" 
                    placeholder="work.email@corp.com" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={workEmail} 
                    onChange={e => setWorkEmail(e.target.value)}
                  />
                </div>

                <div>
                  <CountryPhoneInput
                    id="visitor-alt-phone"
                    label={t('form.altPhone', 'Alternative Phone')}
                    value={altPhone}
                    onChange={e => setAltPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.preferredContact', 'Preferred Contact Method')}
                  </label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={preferredContact} 
                    onChange={e => setPreferredContact(e.target.value)}
                  >
                    <option value="Email">Email Notification</option>
                    <option value="SMS">SMS Message</option>
                    <option value="Phone Call">Direct Phone Call</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SECTION 4: IDENTIFICATION & PHOTO ══════════════ */}
          {activeSection === 'identity' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <span className="font-black block mb-0.5 text-blue-300">Identity Clearance & Profile Photo</span>
                Ensure your official identification number and profile photo are up-to-date for fast-track security entry.
              </div>

              {/* ID Type & ID Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.documentType', 'Identity Document Type')} *
                  </label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={identityType} 
                    onChange={e => setIdentityType(e.target.value)}
                  >
                    <option value="National ID">National ID (Kebele / Fayda)</option>
                    <option value="Passport">International Passport</option>
                    <option value="Driver License">Driver's License</option>
                    <option value="Work Permit">Work Permit / Employee Badge</option>
                    <option value="Student ID">Student ID</option>
                    <option value="Other">Other Official Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.documentNumber', 'Identity Document Number')} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. ETH-928192-2026 / P1234567" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={identityNumber} 
                    onChange={e => setIdentityNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Issue Date & Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.idIssueDate', 'Document Issue Date')}
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={idIssueDate} 
                    onChange={e => setIdIssueDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.idExpiryDate', 'Document Expiry Date')}
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={idExpiryDate} 
                    onChange={e => setIdExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Photo Upload & Preview Card */}
              <div className="border border-dashed border-slate-800 bg-slate-900/60 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-850 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative group">
                  {photoPreview ? (
                    <img 
                      src={resolvePhotoUrl(photoPreview)} 
                      alt="Visitor Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User className="h-10 w-10 text-slate-500" />
                  )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-1.5">
                  <h4 className="text-xs font-black text-white flex items-center justify-center md:justify-start gap-1.5">
                    {t('form.photo', 'Visitor Digital Profile Avatar')}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Upload a high-resolution face portrait (PNG, JPG, or WEBP up to 5MB). This photo is synced to your entrance digital pass and receptionist identity verification terminal.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl text-xs font-extrabold cursor-pointer border border-blue-500/30 transition-all shadow-md">
                    <Upload className="h-3.5 w-3.5" /> 
                    {t('btn.upload', 'Upload New Photo')}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SECTION 5: EMERGENCY CONTACT DETAILS ══════════════ */}
          {activeSection === 'emergency' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <span className="font-black block mb-0.5 text-blue-300">Safety & Emergency Contact</span>
                Provide emergency contact personnel details to reach out to in case of urgent security or safety incidents.
              </div>

              {/* Name & Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.emergencyContactName', 'Emergency Contact Full Name')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Almaz Bekele" 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={emergencyName} 
                    onChange={e => setEmergencyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.relationship', 'Relationship')}
                  </label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                    value={emergencyRelation} 
                    onChange={e => setEmergencyRelation(e.target.value)}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Colleague">Colleague / Work Associate</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Primary & Secondary Emergency Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CountryPhoneInput
                    id="visitor-emergency-phone"
                    label={t('form.emergencyContactPhone', 'Primary Emergency Phone')}
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                  />
                </div>

                <div>
                  <CountryPhoneInput
                    id="visitor-sec-emergency-phone"
                    label={t('form.secEmergencyPhone', 'Secondary Emergency Phone')}
                    value={secondaryEmergencyPhone}
                    onChange={e => setSecondaryEmergencyPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-semibold hidden sm:block">
              {category} • {company || 'No Company'} • {city}, {country}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 sm:px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t('btn.cancel', 'Cancel')}
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin">⏳</span> Saving Profile...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('btn.save', 'Save & Update Profile')}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
