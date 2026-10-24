import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, MapPin, Phone, Shield, FileText, Upload, Check, AlertCircle, Save, 
  Briefcase, Building, Clock, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Edit3, CheckCircle,
  ShieldCheck, UserCheck, RotateCcw
} from 'lucide-react';
import { visitorPortalApi, authApi } from '../../../services/api';
import { visitorCategoryApi } from '../../../modules/visitor-management/api/visitorCategoryApi';
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

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // ══════════════════════════════════════════════════════════════
  // SANITIZATION HELPERS
  // ══════════════════════════════════════════════════════════════
  const sanitizeText = (val) => {
    if (typeof val !== 'string') return '';
    return val.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim();
  };

  const sanitizeEmail = (val) => {
    if (typeof val !== 'string') return '';
    return val.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
  };

  const sanitizePhone = (val) => {
    if (typeof val !== 'string') return '';
    return val.trim().replace(/[^\d+()\s-]/g, '');
  };

  const sanitizeId = (val) => {
    if (typeof val !== 'string') return '';
    return val.trim().replace(/[^a-zA-Z0-9\-_/]/g, '').toUpperCase();
  };

  // ══════════════════════════════════════════════════════════════
  // DROPDOWN CONSTANTS (MATCHING ADMIN VISITOR CATEGORIES & ACCESS)
  // ══════════════════════════════════════════════════════════════
  const ADMIN_DEFAULT_LOCATIONS = [
    'Reception',
    'Meeting Room',
    'Office Area',
    'Laboratory',
    'Warehouse',
    'Parking Area',
    'Server Room',
    'Executive Floor',
    'Restricted Area',
    'Cafeteria',
    'Loading Bay',
    'Clinic Area',
    'All Standard Visitor Zones',
    'Full Facility Access'
  ];

  const ADMIN_DEFAULT_DAYS = [
    'Monday – Friday',
    'Monday – Saturday',
    'All Days (24/7)',
    'Weekend Only',
    'Single Day Visit Only',
    'Custom Schedule'
  ];

  // 1. VISITOR CATEGORY & ACCESS PRIVILEGES
  const [dbCategories, setDbCategories] = useState([]);
  const [category, setCategory] = useState('General Visitor');
  const [accessLevel, setAccessLevel] = useState('Level 1 (General)');
  const [approvalRequirement, setApprovalRequirement] = useState('Host Approval Required');
  const [categoryDuration, setCategoryDuration] = useState('2 Hours');
  const [escortRequired, setEscortRequired] = useState('No');
  const [allowedAreas, setAllowedAreas] = useState('Reception');
  const [allowedDays, setAllowedDays] = useState('Monday – Friday');
  const [categoryPurpose, setCategoryPurpose] = useState('');

  // Dynamically compute Allowed Areas dropdown options based on DB categories + Admin defaults
  const allowedAreaOptions = React.useMemo(() => {
    const set = new Set(ADMIN_DEFAULT_LOCATIONS);
    if (allowedAreas && allowedAreas.trim()) {
      set.add(allowedAreas.trim());
    }
    dbCategories.forEach(c => {
      if (c.allowed_areas) set.add(c.allowed_areas);
      if (Array.isArray(c.access_levels)) {
        c.access_levels.forEach(a => {
          if (a.location_name) set.add(a.location_name);
        });
      }
    });
    return Array.from(set);
  }, [dbCategories, allowedAreas]);

  // Dynamically compute Allowed Days dropdown options based on DB categories + Admin defaults
  const allowedDaysOptions = React.useMemo(() => {
    const set = new Set(ADMIN_DEFAULT_DAYS);
    if (allowedDays && allowedDays.trim()) {
      set.add(allowedDays.trim());
    }
    dbCategories.forEach(c => {
      if (c.allowed_days) set.add(c.allowed_days);
    });
    return Array.from(set);
  }, [dbCategories, allowedDays]);

  // ══════════════════════════════════════════════════════════════
  // STRICT STEP-LEVEL VALIDATION
  // ══════════════════════════════════════════════════════════════
  const getStepValidationErrors = (stepKey) => {
    const errs = {};

    if (stepKey === 'category') {
      if (!category || !String(category).trim()) {
        errs.category = 'Please select a visitor category from database';
      }
      if (!accessLevel || !String(accessLevel).trim()) {
        errs.accessLevel = 'Please select an access privilege level';
      }
      if (!approvalRequirement || !String(approvalRequirement).trim()) {
        errs.approvalRequirement = 'Please select an approval requirement';
      }
      if (!escortRequired || !String(escortRequired).trim()) {
        errs.escortRequired = 'Please specify if an escort is required';
      }
      if (!allowedAreas || !String(allowedAreas).trim()) {
        errs.allowedAreas = 'Please select an allowed facility area';
      }
      if (!allowedDays || !String(allowedDays).trim()) {
        errs.allowedDays = 'Please select allowed visiting days';
      }
    } else if (stepKey === 'personal') {
      const cleanFirst = sanitizeText(firstName);
      const cleanLast = sanitizeText(lastName);
      const cleanPhone = sanitizePhone(phone);
      const cleanEmail = sanitizeEmail(email);

      if (!cleanFirst) {
        errs.firstName = 'First name is required';
      } else if (cleanFirst.length < 2) {
        errs.firstName = 'First name must be at least 2 characters';
      }

      if (!cleanLast) {
        errs.lastName = 'Last name is required';
      } else if (cleanLast.length < 2) {
        errs.lastName = 'Last name must be at least 2 characters';
      }

      if (!cleanPhone) {
        errs.phone = 'Primary phone number is required';
      } else if (cleanPhone.replace(/\D/g, '').length < 7) {
        errs.phone = 'Please enter a valid phone number (at least 7 digits)';
      }

      if (!cleanEmail) {
        errs.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errs.email = 'Please enter a valid email format (e.g. name@domain.com)';
      }

      if (workEmail && sanitizeEmail(workEmail) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizeEmail(workEmail))) {
        errs.workEmail = 'Please enter a valid work email format';
      }
    } else if (stepKey === 'address') {
      const cleanStreet = sanitizeText(streetAddress);
      const cleanCity = sanitizeText(city);
      const cleanCountry = sanitizeText(country);

      if (!cleanStreet) {
        errs.streetAddress = 'Street address / house number is required';
      }
      if (!cleanCity) {
        errs.city = 'City / Town is required';
      }
      if (!cleanCountry) {
        errs.country = 'Country is required';
      }
    } else if (stepKey === 'identity') {
      const cleanType = sanitizeText(identityType);
      const cleanNumber = sanitizeId(identityNumber);

      if (!cleanType) {
        errs.identityType = 'Identification document type is required';
      }
      if (!cleanNumber) {
        errs.identityNumber = 'Identity document number is required';
      } else if (cleanNumber.length < 3) {
        errs.identityNumber = 'Document number must be at least 3 characters';
      }
    } else if (stepKey === 'emergency') {
      const cleanEmName = sanitizeText(emergencyName);
      const cleanEmPhone = sanitizePhone(emergencyPhone);

      if (!cleanEmName) {
        errs.emergencyName = 'Emergency contact full name is required';
      } else if (cleanEmName.length < 2) {
        errs.emergencyName = 'Contact name must be at least 2 characters';
      }
      if (!cleanEmPhone) {
        errs.emergencyPhone = 'Primary emergency phone is required';
      } else if (cleanEmPhone.replace(/\D/g, '').length < 7) {
        errs.emergencyPhone = 'Please enter a valid emergency phone number';
      }
    }

    return errs;
  };

  // Validate fields for the active step
  const validateCurrentStep = () => {
    const errs = getStepValidationErrors(activeSection);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setErrorMsg('Please complete and validate all required fields for this step before continuing.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  // Validate all steps before final submission
  const validateAllSteps = () => {
    for (const s of STEPS) {
      const errs = getStepValidationErrors(s.key);
      if (Object.keys(errs).length > 0) {
        setActiveSection(s.key);
        setFieldErrors(errs);
        setErrorMsg(`Please complete all required fields in Step ${s.num} (${s.label}) before saving.`);
        return false;
      }
    }
    return true;
  };

  // Clear data from the current step's form fields completely so data does not leak
  const handleClearCurrentStep = () => {
    setFieldErrors({});
    setErrorMsg('');
    if (activeSection === 'category') {
      setCategory('');
      setAccessLevel('');
      setApprovalRequirement('');
      setEscortRequired('');
      setAllowedAreas('');
      setAllowedDays('');
      setCategoryPurpose('');
    } else if (activeSection === 'personal') {
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setWorkEmail('');
      setAltPhone('');
      setPreferredContact('');
    } else if (activeSection === 'address') {
      setStreetAddress('');
      setCity('');
      setSubcity('');
      setStateProvince('');
      setCountry('');
      setPostalCode('');
    } else if (activeSection === 'identity') {
      setIdentityType('');
      setIdentityNumber('');
      setIdIssueDate('');
      setIdExpiryDate('');
      setPhotoPreview(null);
    } else if (activeSection === 'emergency') {
      setEmergencyName('');
      setEmergencyRelation('');
      setEmergencyPhone('');
      setSecondaryEmergencyPhone('');
    }
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (!validateCurrentStep()) {
      return;
    }
    setFieldErrors({});
    if (currentStepIndex < STEPS.length - 1) {
      setActiveSection(STEPS[currentStepIndex + 1].key);
    }
  };

  const handlePrevStep = () => {
    setFieldErrors({});
    setErrorMsg('');
    if (currentStepIndex > 0) {
      setActiveSection(STEPS[currentStepIndex - 1].key);
    }
  };

  // Appointment details (Auto-fetched from appointment form / initialData)
  const [company, setCompany] = useState('');
  const [hostName, setHostName] = useState('');
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('Head Office / Main HQ');
  const [location, setLocation] = useState('Main Entrance Desk');
  const [duration, setDuration] = useState('60');
  const [purpose, setPurpose] = useState('');

  // Helper to apply database category features and match admin privileges
  const applyCategoryFeatures = (catObj) => {
    if (!catObj) return;
    const catName = catObj.category_name || catObj.name || '';
    if (catName) {
      setCategory(catName);
      clearFieldError('category');
    }

    // Access Level
    if (catObj.access_level) {
      setAccessLevel(catObj.access_level);
      clearFieldError('accessLevel');
    }

    // Approval Requirement
    if (catObj.department_approval_required && catObj.security_approval_required) {
      setApprovalRequirement('Department + Security');
      clearFieldError('approvalRequirement');
    } else if (catObj.approval_required || catObj.host_approval_required) {
      setApprovalRequirement('Host Approval Required');
      clearFieldError('approvalRequirement');
    } else if (catObj.approval_requirement) {
      setApprovalRequirement(catObj.approval_requirement);
      clearFieldError('approvalRequirement');
    } else if (catObj.approval_required === false && catObj.host_approval_required === false) {
      setApprovalRequirement('Automatic');
      clearFieldError('approvalRequirement');
    }

    // Duration
    if (catObj.default_visit_duration || catObj.max_visit_duration) {
      setCategoryDuration(catObj.default_visit_duration || catObj.max_visit_duration);
    }

    // Escort Required
    if (catObj.escort_required !== undefined) {
      setEscortRequired(catObj.escort_required ? 'Yes' : 'No');
      clearFieldError('escortRequired');
    }

    // Match Allowed Areas from access_levels array or allowed_areas string
    let matchedArea = '';
    if (Array.isArray(catObj.access_levels) && catObj.access_levels.length > 0) {
      const granted = catObj.access_levels
        .filter(a => a.is_granted !== false)
        .map(a => a.location_name);
      if (granted.length > 0) {
        matchedArea = granted[0];
      }
    }
    if (!matchedArea && catObj.allowed_areas) {
      matchedArea = catObj.allowed_areas;
    }
    if (!matchedArea && catObj.location) {
      matchedArea = catObj.location;
    }
    if (matchedArea) {
      setAllowedAreas(matchedArea);
      clearFieldError('allowedAreas');
    }

    // Match Allowed Days
    if (catObj.allowed_days) {
      setAllowedDays(catObj.allowed_days);
      clearFieldError('allowedDays');
    }

    if (catObj.description) {
      setCategoryPurpose(catObj.description);
    }
  };

  const handleCategoryChange = (newCatName) => {
    setCategory(newCatName);
    clearFieldError('category');
    const found = dbCategories.find(c => (c.category_name || c.name) === newCatName);
    if (found) {
      applyCategoryFeatures(found);
    }
  };

  // Fetch visitor categories stored in database matching Admin page
  useEffect(() => {
    let isMounted = true;
    const fetchCategoriesFromDb = async () => {
      try {
        let list = [];
        try {
          const res = await visitorCategoryApi.getAll({ limit: 100 });
          const responseData = res?.data !== undefined ? res.data : res;
          list = Array.isArray(responseData) 
            ? responseData 
            : (responseData?.data || responseData?.categories || []);
        } catch (apiErr) {
          if (visitorPortalApi.getCategories) {
            const fallbackRes = await visitorPortalApi.getCategories({ limit: 100 });
            const fData = fallbackRes?.data !== undefined ? fallbackRes.data : fallbackRes;
            list = Array.isArray(fData) ? fData : (fData?.data || fData?.categories || []);
          }
        }

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
    setAllowedAreas(getVal('allowed_areas', 'allowedAreas') || '');
    setAllowedDays(getVal('allowed_days', 'allowedDays') || '');
    setCategoryPurpose(getVal('category_purpose', 'categoryPurpose') || '');

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
    if (!validateAllSteps()) {
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Sanitize all inputs before saving
    const cleanFirstName = sanitizeText(firstName);
    const cleanMiddleName = sanitizeText(middleName);
    const cleanLastName = sanitizeText(lastName);
    const cleanCompany = sanitizeText(company);
    const cleanStreetAddress = sanitizeText(streetAddress);
    const cleanCity = sanitizeText(city);
    const cleanSubcity = sanitizeText(subcity);
    const cleanStateProvince = sanitizeText(stateProvince);
    const cleanCountry = sanitizeText(country);
    const cleanPostalCode = sanitizeText(postalCode);
    const cleanEmail = sanitizeEmail(email);
    const cleanWorkEmail = sanitizeEmail(workEmail);
    const cleanPhone = sanitizePhone(phone);
    const cleanAltPhone = sanitizePhone(altPhone);
    const cleanIdType = sanitizeText(identityType);
    const cleanIdNumber = sanitizeId(identityNumber);
    const cleanEmergencyName = sanitizeText(emergencyName);
    const cleanEmergencyRelation = sanitizeText(emergencyRelation);
    const cleanEmergencyPhone = sanitizePhone(emergencyPhone);
    const cleanSecEmergencyPhone = sanitizePhone(secondaryEmergencyPhone);
    const cleanCategory = sanitizeText(category);
    const cleanAccessLevel = sanitizeText(accessLevel);
    const cleanApprovalReq = sanitizeText(approvalRequirement);
    const cleanAllowedAreas = sanitizeText(allowedAreas);
    const cleanAllowedDays = sanitizeText(allowedDays);

    const resolvedFullName = `${cleanFirstName} ${cleanMiddleName} ${cleanLastName}`.replace(/\s+/g, ' ').trim() || (user?.fullName || user?.full_name || 'Visitor');
    const fullAddress = `${cleanStreetAddress}${cleanSubcity ? ', ' + cleanSubcity : ''}, ${cleanCity}, ${cleanCountry}`.replace(/^,\s*/, '');

    const payload = {
      // 1. Visitor Category & Privileges (Image 3)
      category: cleanCategory,
      visitor_category: cleanCategory,
      visitorCategory: cleanCategory,
      access_level: cleanAccessLevel,
      accessLevel: cleanAccessLevel,
      approval_requirement: cleanApprovalReq,
      approvalRequirement: cleanApprovalReq,
      category_duration: categoryDuration,
      visit_duration_text: categoryDuration,
      escort_required: escortRequired === 'Yes',
      escortRequired,
      allowed_areas: cleanAllowedAreas,
      allowedAreas: cleanAllowedAreas,
      allowed_days: cleanAllowedDays,
      allowedDays: cleanAllowedDays,
      category_purpose: categoryPurpose,
      categoryPurpose,
      company: cleanCompany,
      visitor_company: cleanCompany,
      visitorCompany: cleanCompany,
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
      street_address: cleanStreetAddress,
      streetAddress: cleanStreetAddress,
      city: cleanCity,
      subcity: cleanSubcity,
      sub_city: cleanSubcity,
      state_province: cleanStateProvince,
      region: cleanStateProvince,
      country: cleanCountry,
      postal_code: cleanPostalCode,
      postalCode: cleanPostalCode,

      // 3. Personal & Contact
      first_name: cleanFirstName,
      firstName: cleanFirstName,
      middle_name: cleanMiddleName,
      middleName: cleanMiddleName,
      last_name: cleanLastName,
      lastName: cleanLastName,
      full_name: resolvedFullName,
      fullName: resolvedFullName,
      visitorName: resolvedFullName,
      phone: cleanPhone,
      email: cleanEmail,
      work_email: cleanWorkEmail,
      workEmail: cleanWorkEmail,
      alternative_phone: cleanAltPhone,
      altPhone: cleanAltPhone,
      preferred_contact_method: preferredContact,
      preferredContact,

      // 4. Identification & Photo
      id_type: cleanIdType,
      idType: cleanIdType,
      identity_type: cleanIdType,
      identityType: cleanIdType,
      id_number: cleanIdNumber,
      idNumber: cleanIdNumber,
      identity_number: cleanIdNumber,
      identityNumber: cleanIdNumber,
      id_issue_date: idIssueDate,
      idIssueDate,
      id_expiry_date: idExpiryDate,
      idExpiryDate,
      photo_url: photoPreview,
      photoUrl: photoPreview,
      avatarUrl: photoPreview,
      profile_photo: photoPreview,

      // 5. Emergency Contact
      emergency_contact_name: cleanEmergencyName,
      emergencyContactName: cleanEmergencyName,
      emergencyName: cleanEmergencyName,
      emergency_relationship: cleanEmergencyRelation,
      emergencyRelationship: cleanEmergencyRelation,
      emergencyRelation: cleanEmergencyRelation,
      emergency_phone: cleanEmergencyPhone,
      emergencyContactPhone: cleanEmergencyPhone,
      emergencyPhone: cleanEmergencyPhone,
      secondary_emergency_phone: cleanSecEmergencyPhone,
      secondaryEmergencyPhone: cleanSecEmergencyPhone
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
              handleNextStep();
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
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Step 1 of 5
                    </span>
                    <button 
                      type="button" 
                      onClick={handleClearCurrentStep}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                      title="Clear all fields in this step"
                    >
                      <RotateCcw size={12} /> Clear Step
                    </button>
                  </div>
                </div>

                {/* Form Mode: 6 Category Attributes (All Dropdowns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* 1. Category Dropdown (Fetched from DB) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <Briefcase size={12} className="text-purple-400" /> Category *
                    </label>
                    <select 
                      value={category} 
                      onChange={(e) => {
                        handleCategoryChange(e.target.value);
                        clearFieldError('category');
                      }}
                      className={`w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border ${
                        fieldErrors.category ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-purple-500/50 focus:border-purple-400'
                      } rounded-xl text-white font-bold focus:outline-none transition-colors`}
                    >
                      <option value="">-- Select Category from DB --</option>
                      {dbCategories.length > 0 ? (
                        dbCategories.map(cat => {
                          const name = cat.category_name || cat.name;
                          return <option key={cat.id || name} value={name}>{name}</option>;
                        })
                      ) : (
                        <>
                          <option value="General Visitor">General Visitor</option>
                          <option value="Business Visitor">Business Visitor</option>
                          <option value="Contractor & Maintenance">Contractor & Maintenance</option>
                          <option value="VIP Guest & Delegate">VIP Guest & Delegate</option>
                          <option value="Vendor / Supplier">Vendor / Supplier</option>
                          <option value="Government Official">Government Official</option>
                          <option value="Interview Candidate">Interview Candidate</option>
                          <option value="Client / Customer">Client / Customer</option>
                          <option value="Guest">Guest</option>
                          <option value="Student / Intern">Student / Intern</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                    {fieldErrors.category && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {fieldErrors.category}
                      </p>
                    )}
                  </div>

                  {/* 2. Access Level (Dropdown) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={12} className="text-blue-400" /> Access Level *
                    </label>
                    <select 
                      value={accessLevel} 
                      onChange={(e) => {
                        setAccessLevel(e.target.value);
                        clearFieldError('accessLevel');
                      }} 
                      className={`w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border ${
                        fieldErrors.accessLevel ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-purple-500'
                      } rounded-xl text-white focus:outline-none transition-colors`}
                    >
                      <option value="">-- Select Access Level --</option>
                      <option value="Level 1 (General)">Level 1 (General)</option>
                      <option value="Level 2 (Business)">Level 2 (Business)</option>
                      <option value="Level 2 (Restricted)">Level 2 (Restricted)</option>
                      <option value="Level 3 (Limited)">Level 3 (Limited)</option>
                      <option value="Level 3 (Restricted)">Level 3 (Restricted)</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="VIP">VIP</option>
                      <option value="ESCORT_REQUIRED">ESCORT REQUIRED</option>
                    </select>
                    {fieldErrors.accessLevel && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {fieldErrors.accessLevel}
                      </p>
                    )}
                  </div>

                  {/* 3. Approval Requirement (Dropdown) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Approval Requirement *
                    </label>
                    <select 
                      value={approvalRequirement} 
                      onChange={(e) => {
                        setApprovalRequirement(e.target.value);
                        clearFieldError('approvalRequirement');
                      }} 
                      className={`w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border ${
                        fieldErrors.approvalRequirement ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-purple-500'
                      } rounded-xl text-white focus:outline-none transition-colors`}
                    >
                      <option value="">-- Select Approval Requirement --</option>
                      <option value="Host Approval Required">Host Approval Required</option>
                      <option value="Department + Security">Department + Security</option>
                      <option value="Pre-Approved">Pre-Approved</option>
                      <option value="Automatic">Automatic</option>
                      <option value="None / Open Access">None / Open Access</option>
                    </select>
                    {fieldErrors.approvalRequirement && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {fieldErrors.approvalRequirement}
                      </p>
                    )}
                  </div>

                  {/* 4. Escort Required (Dropdown) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <UserCheck size={12} className="text-amber-400" /> Escort Required *
                    </label>
                    <select 
                      value={escortRequired} 
                      onChange={(e) => {
                        setEscortRequired(e.target.value);
                        clearFieldError('escortRequired');
                      }} 
                      className={`w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border ${
                        fieldErrors.escortRequired ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-purple-500'
                      } rounded-xl text-white focus:outline-none transition-colors`}
                    >
                      <option value="">-- Select Escort Requirement --</option>
                      <option value="No">No (Unescorted Access)</option>
                      <option value="Yes">Yes (Staff Escort Mandatory)</option>
                    </select>
                    {fieldErrors.escortRequired && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {fieldErrors.escortRequired}
                      </p>
                    )}
                  </div>

                  {/* 5. Allowed Areas (Dropdown Matching Admin Locations) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <MapPin size={12} className="text-emerald-400" /> Allowed Areas *
                    </label>
                    <select 
                      value={allowedAreas} 
                      onChange={(e) => {
                        setAllowedAreas(e.target.value);
                        clearFieldError('allowedAreas');
                      }} 
                      className={`w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border ${
                        fieldErrors.allowedAreas ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-purple-500'
                      } rounded-xl text-white focus:outline-none transition-colors`}
                    >
                      <option value="">-- Select Allowed Area --</option>
                      {allowedAreaOptions.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                    {fieldErrors.allowedAreas && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {fieldErrors.allowedAreas}
                      </p>
                    )}
                  </div>

                  {/* 6. Allowed Days (Dropdown Matching Admin Schedule) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                      <Calendar size={12} className="text-blue-400" /> Allowed Days *
                    </label>
                    <select 
                      value={allowedDays} 
                      onChange={(e) => {
                        setAllowedDays(e.target.value);
                        clearFieldError('allowedDays');
                      }} 
                      className={`w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-950 border ${
                        fieldErrors.allowedDays ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-purple-500'
                      } rounded-xl text-white focus:outline-none transition-colors`}
                    >
                      <option value="">-- Select Allowed Days --</option>
                      {allowedDaysOptions.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    {fieldErrors.allowedDays && (
                      <p className="text-[10px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} /> {fieldErrors.allowedDays}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SECTION 2: ADDRESS INFORMATION ══════════════ */}
          {activeSection === 'address' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-black block mb-0.5 text-blue-300">Residential & Official Address</span>
                  Fill in your current residential or official physical address details for identity validation.
                </div>
                <button 
                  type="button" 
                  onClick={handleClearCurrentStep}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Clear all address fields"
                >
                  <RotateCcw size={12} /> Clear Step
                </button>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                  {t('form.address', 'Street Address / House Number')} *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Bole Road, House #402 / Main Ave" 
                  className={`w-full bg-slate-900 border ${
                    fieldErrors.streetAddress ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                  } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                  value={streetAddress} 
                  onChange={e => {
                    setStreetAddress(e.target.value);
                    clearFieldError('streetAddress');
                  }}
                />
                {fieldErrors.streetAddress && (
                  <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {fieldErrors.streetAddress}
                  </p>
                )}
              </div>

              {/* City & Subcity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.city', 'City / Town')} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Addis Ababa" 
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.city ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={city} 
                    onChange={e => {
                      setCity(e.target.value);
                      clearFieldError('city');
                    }}
                  />
                  {fieldErrors.city && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.city}
                    </p>
                  )}
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
                    label={t('form.country', 'Country') + ' *'}
                    value={country}
                    returnMode="country"
                    onChange={val => {
                      const cName = typeof val === 'object' ? (val.target?.value || val.name || val.country) : val;
                      setCountry(cName || 'Ethiopia');
                      clearFieldError('country');
                    }}
                  />
                  {fieldErrors.country && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.country}
                    </p>
                  )}
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
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-black block mb-0.5 text-blue-300">Personal & Primary Contact</span>
                  Update your legal full name, primary phone number, and official correspondence channels.
                </div>
                <button 
                  type="button" 
                  onClick={handleClearCurrentStep}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Clear all contact fields"
                >
                  <RotateCcw size={12} /> Clear Step
                </button>
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
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.firstName ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={firstName} 
                    onChange={e => {
                      setFirstName(e.target.value);
                      clearFieldError('firstName');
                    }}
                    required
                  />
                  {fieldErrors.firstName && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.firstName}
                    </p>
                  )}
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
                    {t('form.lastName', 'Last / Grandfather Name')} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Last Name" 
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.lastName ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={lastName} 
                    onChange={e => {
                      setLastName(e.target.value);
                      clearFieldError('lastName');
                    }}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CountryPhoneInput
                    id="visitor-profile-phone"
                    label={t('form.phone', 'Primary Phone Number') + ' *'}
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    placeholder="+251 9... or Phone"
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.email', 'Primary Email Address')} *
                  </label>
                  <input 
                    type="email" 
                    placeholder="visitor.email@example.com" 
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.email ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.email}
                    </p>
                  )}
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
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.workEmail ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={workEmail} 
                    onChange={e => {
                      setWorkEmail(e.target.value);
                      clearFieldError('workEmail');
                    }}
                  />
                  {fieldErrors.workEmail && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.workEmail}
                    </p>
                  )}
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
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-black block mb-0.5 text-blue-300">Identity Clearance & Profile Photo</span>
                  Ensure your official identification number and profile photo are up-to-date for fast-track security entry.
                </div>
                <button 
                  type="button" 
                  onClick={handleClearCurrentStep}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Clear identity fields"
                >
                  <RotateCcw size={12} /> Clear Step
                </button>
              </div>

              {/* ID Type & ID Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.documentType', 'Identity Document Type')} *
                  </label>
                  <select 
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.identityType ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={identityType} 
                    onChange={e => {
                      setIdentityType(e.target.value);
                      clearFieldError('identityType');
                    }}
                  >
                    <option value="National ID">National ID (Kebele / Fayda)</option>
                    <option value="Passport">International Passport</option>
                    <option value="Driver License">Driver's License</option>
                    <option value="Work Permit">Work Permit / Employee Badge</option>
                    <option value="Student ID">Student ID</option>
                    <option value="Other">Other Official Document</option>
                  </select>
                  {fieldErrors.identityType && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.identityType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.documentNumber', 'Identity Document Number')} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. ETH-928192-2026 / P1234567" 
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.identityNumber ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={identityNumber} 
                    onChange={e => {
                      setIdentityNumber(e.target.value);
                      clearFieldError('identityNumber');
                    }}
                  />
                  {fieldErrors.identityNumber && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.identityNumber}
                    </p>
                  )}
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
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-black block mb-0.5 text-blue-300">Safety & Emergency Contact</span>
                  Provide emergency contact personnel details to reach out to in case of urgent security or safety incidents.
                </div>
                <button 
                  type="button" 
                  onClick={handleClearCurrentStep}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Clear emergency fields"
                >
                  <RotateCcw size={12} /> Clear Step
                </button>
              </div>

              {/* Name & Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    {t('form.emergencyContactName', 'Emergency Contact Full Name')} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Almaz Bekele" 
                    className={`w-full bg-slate-900 border ${
                      fieldErrors.emergencyName ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800 focus:border-blue-500'
                    } text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-colors`}
                    value={emergencyName} 
                    onChange={e => {
                      setEmergencyName(e.target.value);
                      clearFieldError('emergencyName');
                    }}
                  />
                  {fieldErrors.emergencyName && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.emergencyName}
                    </p>
                  )}
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
                    label={t('form.emergencyContactPhone', 'Primary Emergency Phone') + ' *'}
                    value={emergencyPhone}
                    onChange={e => {
                      setEmergencyPhone(e.target.value);
                      clearFieldError('emergencyPhone');
                    }}
                    placeholder="+251 9... or Phone"
                  />
                  {fieldErrors.emergencyPhone && (
                    <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErrors.emergencyPhone}
                    </p>
                  )}
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
                      <span>1. Category</span>
                      <button type="button" onClick={() => setActiveSection('category')} className="hover:underline flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{category || '—'}</div>
                    <div className="text-[11px] text-slate-400 truncate">Access: <span className="text-slate-200">{accessLevel}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Approval: <span className="text-slate-200">{approvalRequirement}</span></div>
                    <div className="text-[11px] text-slate-400 truncate">Escort: <span className="text-slate-200">{escortRequired}</span></div>
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
              <span>{category || 'No Category Selected'}</span>
              <span>•</span>
              <span>{company || 'Independent Visitor'}</span>
              <span>•</span>
              <span>{city || 'No City'}, {country || 'No Country'}</span>
            </div>

            <div className="flex items-center gap-3 ml-auto flex-wrap">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 sm:px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t('btn.cancel', 'Cancel')}
              </button>

              {/* Clear Step Button */}
              <button 
                type="button" 
                onClick={handleClearCurrentStep} 
                className="px-3.5 sm:px-4 py-2.5 border border-slate-700/80 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear current step fields"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Step</span>
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

              {/* Next Button for Steps 1 to 4 */}
              {currentStepNum < STEPS.length && (
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
