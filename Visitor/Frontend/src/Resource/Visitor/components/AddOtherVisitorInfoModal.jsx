import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, MapPin, Phone, Shield, FileText, Upload, Check, AlertCircle, Save, 
  Briefcase, Building, Clock, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Edit3, CheckCircle,
  ShieldCheck, UserCheck
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

  // Offset overlay to position modal in right display area (not hidden behind sidebar)
  const [sidebarOffset, setSidebarOffset] = useState({ left: '0px', width: '100vw' });

  useEffect(() => {
    if (!isOpen) return;
    const calculateOffset = () => {
      if (window.innerWidth < 992) {
        setSidebarOffset({ left: '0px', width: '100vw' });
        return;
      }
      const sidebarEl = document.querySelector('.vms-sidebar');
      const wrapperEl = document.querySelector('.vms-main-wrapper');
      const isCollapsed = wrapperEl?.classList.contains('sidebar-collapsed');
      const leftWidth = sidebarEl ? sidebarEl.getBoundingClientRect().width : (isCollapsed ? 70 : 260);
      setSidebarOffset({ 
        left: `${leftWidth}px`,
        width: `calc(100vw - ${leftWidth}px)`
      });
    };

    calculateOffset();
    window.addEventListener('resize', calculateOffset);

    const observer = new MutationObserver(calculateOffset);
    const wrapper = document.querySelector('.vms-main-wrapper');
    if (wrapper) {
      observer.observe(wrapper, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      window.removeEventListener('resize', calculateOffset);
      observer.disconnect();
    };
  }, [isOpen]);

  // Wizard Stepper Definition (Image 2 style)
  const STEPS = [
    { num: 1, key: 'category', label: 'CATEGORY', subtitle: 'Category & Privileges', icon: Briefcase },
    { num: 2, key: 'personal', label: 'CONTACT', subtitle: 'Personal & Contact Info', icon: Phone },
    { num: 3, key: 'address', label: 'ADDRESS', subtitle: 'Residential & Official Address', icon: MapPin },
    { num: 4, key: 'identity', label: 'ID & PHOTO', subtitle: 'Identification & Photo Upload', icon: FileText },
    { num: 5, key: 'emergency', label: 'REVIEW', subtitle: 'Emergency & Final Summary', icon: CheckCircle2 }
  ];

  // Active Navigation Tab
  const [activeSection, setActiveSection] = useState('category');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentStepIndex = STEPS.findIndex(s => s.key === activeSection);
  const currentStepNum = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setActiveSection(STEPS[currentStepIndex + 1].key);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveSection(STEPS[currentStepIndex - 1].key);
    }
  };

  // 1. VISITOR CATEGORY & ACCESS PRIVILEGES
  const [dbCategories, setDbCategories] = useState([]);
  const [category, setCategory] = useState('General Visitor');
  const [accessLevel, setAccessLevel] = useState('Level 1 (General)');
  const [approvalRequirement, setApprovalRequirement] = useState('Host Approval Required');
  const [categoryDuration, setCategoryDuration] = useState('2 Hours');
  const [escortRequired, setEscortRequired] = useState('No');
  const [allowedAreas, setAllowedAreas] = useState('Main Lobby & Reception');
  const [allowedDays, setAllowedDays] = useState('Monday – Friday');
  const [categoryPurpose, setCategoryPurpose] = useState('General Visit');

  // Check if all Step 1 category fields are filled
  const isStep1Complete = Boolean(
    category && String(category).trim() !== '' &&
    accessLevel && String(accessLevel).trim() !== '' &&
    approvalRequirement && String(approvalRequirement).trim() !== '' &&
    categoryDuration && String(categoryDuration).trim() !== '' &&
    escortRequired && String(escortRequired).trim() !== '' &&
    allowedAreas && String(allowedAreas).trim() !== '' &&
    allowedDays && String(allowedDays).trim() !== '' &&
    categoryPurpose && String(categoryPurpose).trim() !== ''
  );

  // Appointment details (Auto-fetched from appointment form / initialData)
  const [company, setCompany] = useState('');
  const [hostName, setHostName] = useState('');
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('Head Office / Main HQ');
  const [location, setLocation] = useState('Main Entrance Desk');
  const [duration, setDuration] = useState('60');
  const [purpose, setPurpose] = useState('');

  // Helper to apply database category features
  const applyCategoryFeatures = (catObj) => {
    if (!catObj) return;
    if (catObj.category_name || catObj.name) setCategory(catObj.category_name || catObj.name);
    if (catObj.access_level) setAccessLevel(catObj.access_level);
    if (catObj.approval_required !== undefined || catObj.host_approval_required !== undefined) {
      setApprovalRequirement(
        catObj.department_approval_required && catObj.security_approval_required
          ? 'Department + Security'
          : catObj.approval_required || catObj.host_approval_required
          ? 'Host Approval Required'
          : 'Automatic'
      );
    }
    if (catObj.default_visit_duration || catObj.max_visit_duration) {
      setCategoryDuration(catObj.default_visit_duration || catObj.max_visit_duration);
    }
    if (catObj.escort_required !== undefined) {
      setEscortRequired(catObj.escort_required ? 'Yes' : 'No');
    }
    if (catObj.allowed_areas) setAllowedAreas(catObj.allowed_areas);
    if (catObj.allowed_days) setAllowedDays(catObj.allowed_days);
    if (catObj.description) setCategoryPurpose(catObj.description);
  };

  const handleCategoryChange = (newCatName) => {
    setCategory(newCatName);
    const found = dbCategories.find(c => (c.category_name || c.name) === newCatName);
    if (found) {
      applyCategoryFeatures(found);
    }
  };

  // Fetch visitor categories stored in database
  useEffect(() => {
    let isMounted = true;
    const fetchCategoriesFromDb = async () => {
      try {
        const res = await (visitorPortalApi.getCategories ? visitorPortalApi.getCategories({ limit: 100 }) : fetch('/api/visitor-categories', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        }).then(r => r.json()));

        const responseData = res?.data !== undefined ? res.data : res;
        const list = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || responseData?.categories || []);

        if (isMounted && list && list.length > 0) {
          setDbCategories(list);
          const currentMatch = list.find(c => (c.category_name || c.name || '').toLowerCase() === (category || '').toLowerCase());
          if (currentMatch) {
            applyCategoryFeatures(currentMatch);
          }
        }
      } catch (err) {
        console.warn('Visitor categories fetch note:', err.message);
      }
    };
    if (isOpen) {
      fetchCategoriesFromDb();
    }
    return () => { isMounted = false; };
  }, [isOpen]);

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

    // Category & Privileges (Image 3)
    const initialCat = getVal('category', 'visitor_category') || 'General Visitor';
    setCategory(initialCat);
    setAccessLevel(getVal('access_level', 'accessLevel') || 'Level 1 (General)');
    setApprovalRequirement(getVal('approval_requirement', 'approvalRequirement') || 'Host Approval Required');
    setCategoryDuration(getVal('category_duration', 'categoryDuration', 'default_visit_duration', 'visitDuration') || '2 Hours');
    setEscortRequired(getVal('escort_required', 'escortRequired') ? 'Yes' : 'No');
    setAllowedAreas(getVal('allowed_areas', 'allowedAreas') || 'Main Lobby & Reception');
    setAllowedDays(getVal('allowed_days', 'allowedDays') || 'Monday – Friday');
    setCategoryPurpose(getVal('category_purpose', 'categoryPurpose') || 'General Visit');

    // Appointment details (Auto-fetched from appointment form / initialData)
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
      // 1. Visitor Category & Privileges (Image 3)
      category,
      visitor_category: category,
      visitorCategory: category,
      access_level: accessLevel,
      accessLevel,
      approval_requirement: approvalRequirement,
      approvalRequirement,
      category_duration: categoryDuration,
      visit_duration_text: categoryDuration,
      escort_required: escortRequired === 'Yes',
      escortRequired,
      allowed_areas: allowedAreas,
      allowedAreas,
      allowed_days: allowedDays,
      allowedDays,
      category_purpose: categoryPurpose,
      categoryPurpose,
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

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed top-0 bottom-0 right-0 z-[99999] flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto transition-[left,width] duration-300"
      style={{ left: sidebarOffset.left, width: sidebarOffset.width }}
    >
      <div className="bg-[#0b1220] border border-slate-800 text-white rounded-3xl w-full max-w-5xl xl:max-w-6xl h-[92vh] max-h-[920px] flex flex-col overflow-hidden shadow-2xl shadow-blue-950/50 my-auto animate-fadeIn">
        
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shrink-0 shadow-inner">
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {t('visitor.addUpdateTitle', 'Visitor Profile & Appointment Info')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Step {currentStepNum} of {STEPS.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1 hidden sm:block">
                Update visitor category, address, company, host, branch, and personal credentials.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress Bar (Image 2 style) */}
        <div className="px-6 sm:px-8 py-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="bg-[#10192e] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner relative">
            {/* Connecting progress track */}
            <div className="absolute top-8 left-12 right-12 h-0.5 bg-slate-800 -z-0" />
            <div 
              className="absolute top-8 left-12 h-0.5 bg-blue-600 transition-all duration-300 -z-0" 
              style={{ width: `${(Math.max(0, currentStepIndex) / 4) * 85}%` }} 
            />

            <div className="flex justify-between items-center relative">
              {STEPS.map(s => {
                const isActive = activeSection === s.key;
                const isPast = s.num < currentStepNum;
                return (
                  <div
                    key={s.num}
                    className="flex flex-col items-center z-10 select-none"
                  >
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/50 ring-4 ring-blue-500/25 scale-110' 
                        : isPast 
                          ? 'bg-blue-950 border border-blue-500/50 text-blue-400' 
                          : 'bg-slate-800/90 border border-slate-700/80 text-slate-400'
                    }`}>
                      {isPast ? <Check className="h-4 w-4" /> : s.num}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-black mt-2 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-blue-400' : isPast ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                    <span className="hidden md:block text-[10px] font-semibold text-slate-400/80 mt-0.5">
                      {s.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form 
          onSubmit={(e) => {
            if (currentStepNum < STEPS.length) {
              e.preventDefault();
              if (currentStepNum === 1 && isStep1Complete) {
                handleNextStep();
              } else if (currentStepNum > 1) {
                handleNextStep();
              }
              return;
            }
            handleSubmit(e);
          }} 
          className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-6">

          {/* ══════════════ SECTION 1: VISITOR CATEGORY & ACCESS PRIVILEGES ══════════════ */}
          {activeSection === 'category' && (
            <div className="space-y-5">
              {/* Visitor Category & Access Privileges Form */}
              <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-400" /> VISITOR CATEGORY &amp; ACCESS PRIVILEGES
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Step 1 of 5
                  </span>
                </div>

                {/* Form Mode: Only Visitor Category features, with category dropdown fetched from database */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* 1. Category Dropdown (Fetched from DB) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <Briefcase size={12} className="text-purple-400" /> Category *
                    </label>
                    <select 
                      value={category} 
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-purple-500/50 rounded-xl text-white font-bold focus:border-purple-400 focus:outline-none transition-colors"
                      required
                    >
                      {dbCategories.length > 0 ? (
                        dbCategories.map(cat => {
                          const name = cat.category_name || cat.name;
                          return <option key={cat.id || name} value={name}>{name}</option>;
                        })
                      ) : (
                        <>
                          <option value="General Visitor">General Visitor</option>
                          <option value="Business Visitor">Business Visitor</option>
                          <option value="Contractor">Contractor</option>
                          <option value="VIP / Executive">VIP / Executive</option>
                          <option value="Vendor / Supplier">Vendor / Supplier</option>
                          <option value="Government Official">Government Official</option>
                          <option value="Job Applicant / Interviewee">Job Applicant / Interviewee</option>
                          <option value="Client / Customer">Client / Customer</option>
                          <option value="Guest">Guest</option>
                          <option value="Student / Intern">Student / Intern</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 2. Access Level */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={12} className="text-blue-400" /> Access Level *
                    </label>
                    <select 
                      value={accessLevel} 
                      onChange={(e) => setAccessLevel(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                    >
                      <option value="Level 1 (General)">Level 1 (General)</option>
                      <option value="Level 2 (Business)">Level 2 (Business)</option>
                      <option value="Level 3 (Restricted)">Level 3 (Restricted)</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="VIP">VIP</option>
                      <option value="ESCORT_REQUIRED">ESCORT REQUIRED</option>
                    </select>
                  </div>

                  {/* 3. Approval Requirement */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Approval Requirement *
                    </label>
                    <select 
                      value={approvalRequirement} 
                      onChange={(e) => setApprovalRequirement(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                    >
                      <option value="Host Approval Required">Host Approval Required</option>
                      <option value="Department + Security">Department + Security</option>
                      <option value="Pre-Approved">Pre-Approved</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>

                  {/* 4. Visit Duration */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <Clock size={12} className="text-indigo-400" /> Visit Duration *
                    </label>
                    <input 
                      type="text" 
                      value={categoryDuration} 
                      placeholder="e.g. 2 Hours, 1 Day, 8 Hours" 
                      onChange={(e) => setCategoryDuration(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* 5. Escort Required */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <UserCheck size={12} className="text-amber-400" /> Escort Required *
                    </label>
                    <select 
                      value={escortRequired} 
                      onChange={(e) => setEscortRequired(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {/* 6. Allowed Areas */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <MapPin size={12} className="text-emerald-400" /> Allowed Areas *
                    </label>
                    <input 
                      type="text" 
                      value={allowedAreas} 
                      placeholder="e.g. Main Lobby & Reception" 
                      onChange={(e) => setAllowedAreas(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* 7. Allowed Days */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <Calendar size={12} className="text-blue-400" /> Allowed Days *
                    </label>
                    <input 
                      type="text" 
                      value={allowedDays} 
                      placeholder="e.g. Monday – Friday" 
                      onChange={(e) => setAllowedDays(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* 8. Visit Purpose */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <FileText size={12} className="text-purple-400" /> Visit Purpose *
                    </label>
                    <input 
                      type="text" 
                      value={categoryPurpose} 
                      placeholder="e.g. General Visit, Business Consultation" 
                      onChange={(e) => setCategoryPurpose(e.target.value)} 
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
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

              {/* Step 5: Profile & Visit Summary Review Card */}
              <div className="mt-6 p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Visitor Registration & Clearance Summary
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Ready to Save
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tile 1: General & Visit */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-400">
                      <span>1. General</span>
                      <button type="button" onClick={() => setActiveSection('category')} className="hover:underline flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{category}</div>
                    <div className="text-[11px] text-slate-400 truncate">Company: <span className="text-slate-200">{company || 'Independent'}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Host: <span className="text-slate-200">{hostName || 'Staff'}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Duration: <span className="text-slate-200">{duration} min</span></div>
                  </div>

                  {/* Tile 2: Personal & Contact */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-400">
                      <span>2. Contact</span>
                      <button type="button" onClick={() => setActiveSection('personal')} className="hover:underline flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {[firstName, middleName, lastName].filter(Boolean).join(' ') || 'Visitor Name'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">Phone: <span className="text-slate-200">{phone || '—'}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Email: <span className="text-slate-200">{email || '—'}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Pref: <span className="text-slate-200">{preferredContact}</span></div>
                  </div>

                  {/* Tile 3: Address */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-400">
                      <span>3. Address</span>
                      <button type="button" onClick={() => setActiveSection('address')} className="hover:underline flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{streetAddress || 'No street specified'}</div>
                    <div className="text-[11px] text-slate-400 truncate">City: <span className="text-slate-200">{city}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Country: <span className="text-slate-200">{country}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Zip: <span className="text-slate-200">{postalCode || '—'}</span></div>
                  </div>

                  {/* Tile 4: Identity & Photo */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-400">
                      <span>4. ID & Photo</span>
                      <button type="button" onClick={() => setActiveSection('identity')} className="hover:underline flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {photoPreview ? (
                        <img src={resolvePhotoUrl(photoPreview)} alt="Profile" className="h-8 w-8 rounded-lg object-cover border border-blue-500/40" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{identityType}</div>
                        <div className="text-[10px] text-slate-400 truncate">{identityNumber || 'No ID Number'}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold truncate">
                      {photoPreview ? '✓ Photo Attached' : 'Optional Photo'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4 mt-auto">
            <div className="text-xs text-slate-400 font-semibold hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{category}</span>
              <span>•</span>
              <span>{company || 'Independent Visitor'}</span>
              <span>•</span>
              <span>{city}, {country}</span>
            </div>

            <div className="flex items-center gap-3 ml-auto flex-wrap">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 sm:px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t('btn.cancel', 'Cancel')}
              </button>

              {/* Back Button: displayed on Step 2, 3, 4, 5 */}
              {currentStepNum > 1 && (
                <button 
                  type="button" 
                  onClick={handlePrevStep}
                  className="px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}

              {/* Step 1 Next Button: appears when all Step 1 data is filled */}
              {currentStepNum === 1 && (
                isStep1Complete ? (
                  <button 
                    type="button" 
                    onClick={handleNextStep}
                    className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl">
                    Fill all category fields to proceed
                  </span>
                )
              )}

              {/* Intermediate Steps (Step 2, 3, 4): Next Button */}
              {currentStepNum > 1 && currentStepNum < STEPS.length && (
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Step 5 (End of Step): Back and Save Button ONLY */}
              {currentStepNum === STEPS.length && (
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 sm:px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin">⏳</span> Saving Profile...
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
