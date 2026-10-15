import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Save, Building, Phone, Mail, MapPin, CheckCircle, AlertCircle, Upload, Camera, Globe, Clock, Calendar, Check, Trash2, Sparkles, X } from 'lucide-react';
import api from '../../../../services/api';
import { parseBackendFormErrors, focusFirstInvalidFieldInDom } from '../../../../utils/formErrorUtils';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Curated corporate emblem presets
const PRESET_LOGOS = [
    { id: 'tech', label: 'Tech & AI', amLabel: 'ቴክ እና አይ', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80', gradient: 'from-blue-600 to-indigo-600', letter: 'TX' },
    { id: 'finance', label: 'Finance & Bank', amLabel: 'ፋይናንስ እና ባንክ', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160&auto=format&fit=crop&q=80', gradient: 'from-emerald-600 to-teal-600', letter: 'FN' },
    { id: 'health', label: 'Healthcare', amLabel: 'ጤና ጥበቃ', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=160&auto=format&fit=crop&q=80', gradient: 'from-rose-600 to-pink-600', letter: 'HC' },
    { id: 'enterprise', label: 'Enterprise HQ', amLabel: 'ዋና መስሪያ ቤት', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80', gradient: 'from-purple-600 to-indigo-700', letter: 'HQ' },
    { id: 'global', label: 'Global Trade', amLabel: 'ዓለም አቀፍ ንግድ', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=160&auto=format&fit=crop&q=80', gradient: 'from-amber-600 to-orange-600', letter: 'GL' },
];
const WORKING_DAYS_LIST = [
    { id: 'mon', label: 'Mon', full: 'Monday', amFull: 'ሰኞ' },
    { id: 'tue', label: 'Tue', full: 'Tuesday', amFull: 'ማክሰኞ' },
    { id: 'wed', label: 'Wed', full: 'Wednesday', amFull: 'ረቡዕ' },
    { id: 'thu', label: 'Thu', full: 'Thursday', amFull: 'ሐሙስ' },
    { id: 'fri', label: 'Fri', full: 'Friday', amFull: 'አርብ' },
    { id: 'sat', label: 'Sat', full: 'Saturday', amFull: 'ቅዳሜ' },
    { id: 'sun', label: 'Sun', full: 'Sunday', amFull: 'እሑድ' },
];
export default function CreateOrgWizard() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [codeStatus, setCodeStatus] = useState('idle');
    const [logoInputType, setLogoInputType] = useState('upload');
    const fileInputRef = useRef(null);
    // Master wizard state payload
    const [formData, setFormData] = useState({
        // Step 1: General & Profile
        name: '',
        shortName: '',
        code: '',
        registrationNumber: '',
        taxNumber: '',
        logoUrl: '',
        // Step 2: Operational
        email: '',
        phone: '',
        website: '',
        businessType: 'CORPORATION',
        address: '',
        city: 'Addis Ababa',
        region: 'Addis Ababa',
        country: 'Ethiopia',
        subCity: 'Bole',
        woreda: '',
        postalCode: '',
        maxVisitorCapacity: '500',
        // Step 3: Schedule & Settings
        workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        workingHoursStart: '08:30',
        workingHoursEnd: '17:30',
        timezone: 'Africa/Addis_Ababa',
        currency: 'ETB',
        language: 'en',
        fiscalYear: 'July - June (Ethiopian Fiscal Calendar)',
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };
    // Handle Logo Upload (File to Data URL)
    const handleLogoFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (file.size > 2 * 1024 * 1024) {
            setError('Logo image must be smaller than 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFormData(prev => ({ ...prev, logoUrl: reader.result }));
                setError('');
            }
        };
        reader.readAsDataURL(file);
    };
    // Toggle Working Days
    const toggleWorkingDay = (dayId) => {
        setFormData(prev => {
            const exists = prev.workingDays.includes(dayId);
            const updated = exists
                ? prev.workingDays.filter(d => d !== dayId)
                : [...prev.workingDays, dayId];
            return { ...prev, workingDays: updated };
        });
    };
    const checkCodeUniqueness = async (code) => {
        if (!code || code.length < 3)
            return;
        setCodeStatus('checking');
        try {
            const res = await api.get(`/organizations/check-code?code=${encodeURIComponent(code)}`);
            setCodeStatus(res.data.taken ? 'taken' : 'available');
            if (res.data.taken) {
                setFieldErrors(prev => ({ ...prev, code: `Code '${code}' is already in use.` }));
            }
            else {
                setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.code;
                    return next;
                });
            }
        }
        catch {
            setCodeStatus('idle');
        }
    };
    const validateStep = (currentStep) => {
        const errors = {};
        // 1. GENERAL
        if (currentStep === 1) {
            if (!formData.name || formData.name.trim().length < 3) {
                errors.name = 'Organization Name is required (min 3 characters).';
            }
            if (!formData.code || !/^[A-Z0-9]{3,10}$/.test(formData.code)) {
                errors.code = 'Code must be uppercase alphanumeric, 3–10 characters (e.g. APX01).';
            }
            if (!formData.registrationNumber || formData.registrationNumber.trim().length === 0) {
                errors.registrationNumber = 'Registration Number is required.';
            }
            if (!formData.taxNumber || formData.taxNumber.trim().length === 0) {
                errors.taxNumber = 'Tax Identification Number (TIN) is required.';
            }
            if (codeStatus === 'taken') {
                errors.code = `Code '${formData.code}' is already in use.`;
            }
        }
        // 2. OPERATIONAL
        if (currentStep === 2) {
            if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errors.email = 'Valid corporate email address is required.';
            }
            if (!formData.phone || formData.phone.trim().length === 0) {
                errors.phone = 'Phone number is required.';
            }
            if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
                errors.website = 'Website must be a valid URL (starting with http:// or https://).';
            }
            if (!formData.address || formData.address.trim().length === 0) {
                errors.address = 'Headquarters street address is required.';
            }
            if (!formData.city || formData.city.trim().length === 0) {
                errors.city = 'City is required.';
            }
            if (!formData.country || formData.country.trim().length === 0) {
                errors.country = 'Country is required.';
            }
            if (!formData.region || formData.region.trim().length === 0) {
                errors.region = 'Region is required.';
            }
            if (!formData.businessType) {
                errors.businessType = 'Business Structure is required.';
            }
        }
        // 3. SCHEDULE
        if (currentStep === 3) {
            if (formData.workingDays.length === 0) {
                errors.workingDays = 'Please select at least one active working day.';
            }
            if (!formData.workingHoursStart || !formData.workingHoursEnd) {
                errors.workingHours = 'Working hours start and cutoff are required.';
            }
            if (!formData.timezone) {
                errors.timezone = 'Default Time Zone is required.';
            }
            if (!formData.language) {
                errors.language = 'Default Language is required.';
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleNext = () => {
        setError('');
        if (validateStep(step)) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else {
            setError('Please resolve all validation errors in the active step.');
        }
    };
    const handleBack = () => {
        setError('');
        setStep(step - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                name: formData.name,
                shortName: formData.shortName,
                code: formData.code,
                registrationNumber: formData.registrationNumber,
                taxNumber: formData.taxNumber,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                address: formData.address,
                city: formData.city,
                region: formData.region,
                country: formData.country,
                subCity: formData.subCity,
                woreda: formData.woreda,
                postalCode: formData.postalCode,
                businessType: formData.businessType,
                timezone: formData.timezone,
                currency: formData.currency,
                language: formData.language,
                logoUrl: formData.logoUrl,
                logo_url: formData.logoUrl,
            };
            const res = await api.post('/organizations', payload);
            const createdOrgId = res.data?.data?.id || res.data?.id;
            // Also persist working settings if available
            if (createdOrgId) {
                try {
                    await api.put(`/organizations/${createdOrgId}/settings`, {
                        workingDays: formData.workingDays,
                        workingHours: { start: formData.workingHoursStart, end: formData.workingHoursEnd },
                        timezone: formData.timezone,
                        language: formData.language,
                        currency: formData.currency,
                        fiscalYear: formData.fiscalYear,
                    });
                }
                catch {
                    // Non-critical background sync
                }
                if (formData.logoUrl) {
                    try {
                        await api.put(`/organizations/${createdOrgId}/branding`, {
                            logoUrl: formData.logoUrl,
                        });
                    }
                    catch {
                        // Non-critical
                    }
                }
            }
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'organizations');
            window.location.search = `?${params.toString()}`;
        }
        catch (err) {
            const { mappedErrors, targetStep, cleanMessage } = parseBackendFormErrors(err, {
                1: ['name', 'shortName', 'code', 'registrationNumber', 'taxNumber', 'logoUrl'],
                2: ['email', 'phone', 'website', 'address', 'city', 'region', 'country', 'subCity', 'woreda', 'postalCode', 'businessType'],
                3: ['workingDays', 'workingHoursStart', 'workingHoursEnd', 'timezone', 'language', 'currency'],
            });
            if (Object.keys(mappedErrors).length > 0) {
                setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
            }
            if (targetStep) {
                setStep(targetStep);
            }
            setError(cleanMessage || 'Failed to register organization. Please review form inputs.');
            focusFirstInvalidFieldInDom();
        }
        finally {
            setLoading(false);
        }
    };
    const renderFieldError = (fieldName) => {
        if (!fieldErrors[fieldName])
            return null;
        return (<div className="text-danger text-xs mt-1 d-flex align-items-center gap-1 fw-semibold animate-fade-in">
        <AlertCircle className="h-3 w-3"/>
        {fieldErrors[fieldName]}
      </div>);
    };
    return (<div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'organizations');
            window.location.search = `?${params.toString()}`;
        }} className="btn btn-outline-secondary btn-sm p-2 rounded-xl" title={isAm ? "ወደ ድርጅቶች ዝርዝር ተመለስ" : "Back to Organizations"}>
            <ArrowLeft className="h-4.5 w-4.5"/>
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
                <Building className="text-blue-600 h-7 w-7"/> {isAm ? 'አዲስ ድርጅት መፍጠሪያ ረዳት' : 'Create Organization Wizard'}
              </h1>
              <span className="badge bg-blue-500/10 text-blue-500 border border-blue-500/30 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase">
                {isAm ? '4-ደረጃ ሂደት' : '4-Step Flow'}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold">
              {isAm 
                ? 'ደረጃ በደረጃ የድርጅት ምዝገባ ከኦፊሴላዊ አርማ/መገለጫ፣ የስራ ማስኬጃ ምስክርነቶች እና የስራ ሰዓት ጋር።' 
                : 'Step-by-step enterprise onboarding with official logo/profile, operational credentials, and scheduling.'}
            </p>
          </div>
        </div>

        <div className="d-none sm:d-flex align-items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400">
            {isAm ? `ደረጃ ${step} ከ 4` : `Step ${step} of 4`}
          </span>
        </div>
      </div>

      {/* ── STEPPER TRACKER ────────────────── */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="d-flex justify-content-between align-items-center position-relative px-2 sm:px-6">
          {[
            { label: 'GENERAL', amLabel: 'አጠቃላይ', num: 1 },
            { label: 'OPERATIONAL', amLabel: 'ስራ ማስኬጃ', num: 2 },
            { label: 'SCHEDULE', amLabel: 'የስራ ሰዓት', num: 3 },
            { label: 'REVIEW', amLabel: 'ማጠቃለያ', num: 4 },
        ].map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (<div key={s.num} onClick={() => {
                    if (s.num < step)
                        setStep(s.num);
                }} className={`d-flex flex-column align-items-center z-1 cursor-pointer transition ${s.num < step ? 'opacity-90 hover:opacity-100' : ''}`}>
                <div className={`h-9 w-9 rounded-full d-flex align-items-center justify-center font-black text-xs transition-all shadow-md ${isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110'
                    : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {isCompleted ? <Check className="h-4 w-4"/> : s.num}
                </div>
                <span className={`text-[11px] font-black mt-2 uppercase tracking-wider transition ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'}`}>
                  {isAm ? s.amLabel : s.label}
                </span>
              </div>);
        })}
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (<div className="alert alert-danger text-xs font-semibold py-3 d-flex align-items-center gap-2 rounded-xl" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          <span>{error}</span>
        </div>)}

      {/* ── STEP CONTENT AREA ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: GENERAL & LOGO / PROFILE                                      */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (<div className="space-y-6">
            <div className="border-bottom pb-3 dark:border-slate-800 d-flex justify-content-between align-items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500"/> {isAm ? '1. አጠቃላይ መገለጫ እና የድርጅት ማንነት' : '1. General Profile & Corporate Identity'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAm 
                    ? 'የድርጅቱን መለያ አርማ፣ ህጋዊ ስም እና የመንግስት ምዝገባ መረጃዎችን ያስገቡ።' 
                    : 'Set up the enterprise branding logo, legal business name, and government registry credentials.'}
                </p>
              </div>
            </div>

            {/* ── LOGO / PROFILE PICTURE UPLOAD SECTION ── */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="d-flex justify-content-between align-items-center">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider d-flex align-items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500"/> {isAm ? 'የድርጅት አርማ / መገለጫ ምስል' : 'Organization Logo / Profile Picture'}
                </label>
                <div className="d-flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button type="button" onClick={() => setLogoInputType('upload')} className={`px-2 py-1 rounded transition ${logoInputType === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                    {isAm ? 'ፋይል ስቀል' : 'File Upload'}
                  </button>
                  <button type="button" onClick={() => setLogoInputType('preset')} className={`px-2 py-1 rounded transition ${logoInputType === 'preset' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                    {isAm ? 'አርማ ይምረጡ' : 'Preset Icons'}
                  </button>
                  <button type="button" onClick={() => setLogoInputType('url')} className={`px-2 py-1 rounded transition ${logoInputType === 'url' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                    {isAm ? 'ድረ-ገጽ URL' : 'Web URL'}
                  </button>
                </div>
              </div>

              {/* Logo Preview & Upload Controls */}
              <div className="d-flex flex-column sm:flex-row align-items-start sm:align-items-center gap-5">
                {/* Visual Avatar / Logo Box */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-blue-400/60 dark:border-blue-500/40 bg-white dark:bg-slate-800/80 d-flex align-items-center justify-center overflow-hidden shadow-inner">
                    {formData.logoUrl ? (<img src={formData.logoUrl} alt="Organization Logo" className="w-full h-full object-contain p-1.5" onError={(e) => {
                    e.target.style.display = 'none';
                }}/>) : (<div className="d-flex flex-column align-items-center justify-center text-slate-400 text-center p-2">
                        <Building className="w-8 h-8 text-blue-500/70 mb-1"/>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{isAm ? 'አርማ የለም' : 'No Logo'}</span>
                      </div>)}
                  </div>

                  {formData.logoUrl && (<button type="button" onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))} className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-500 transition" title={isAm ? "አርማ አስወግድ" : "Remove Logo"}>
                      <X className="w-3.5 h-3.5"/>
                    </button>)}
                </div>

                {/* Upload Form Options */}
                <div className="flex-1 w-full space-y-3">
                  {logoInputType === 'upload' && (<div className="space-y-2">
                      <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoFileUpload} className="d-none"/>
                      <div className="d-flex flex-wrap gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl">
                          <Upload className="w-3.5 h-3.5"/> {isAm ? 'ፋይል ስቀል (PNG / JPG / SVG)' : 'Upload File (PNG / JPG / SVG)'}
                        </button>
                        {formData.logoUrl && (<button type="button" onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl">
                            <Trash2 className="w-3.5 h-3.5"/> {isAm ? 'አርማ አጽዳ' : 'Clear Logo'}
                          </button>)}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isAm ? 'የሚመከር መጠን: 512x512 ግልጽ PNG ወይም SVG። ቢበዛ 2 ሜባ።' : 'Recommended size: 512x512 transparent PNG or SVG. Max 2MB.'}
                      </p>
                    </div>)}

                  {logoInputType === 'preset' && (<div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isAm ? 'የድርጅት አርማ ይምረጡ:' : 'Choose a corporate emblem preset:'}
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {PRESET_LOGOS.map((preset) => (<button type="button" key={preset.id} onClick={() => setFormData(prev => ({ ...prev, logoUrl: preset.url }))} className={`d-flex align-items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${formData.logoUrl === preset.url
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                            <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${preset.gradient} text-white font-mono text-[9px] d-flex items-center justify-center font-black`}>
                              {preset.letter}
                            </span>
                            <span>{isAm ? preset.amLabel : preset.label}</span>
                          </button>))}
                      </div>
                    </div>)}

                  {logoInputType === 'url' && (<div className="space-y-2">
                      <div className="position-relative">
                        <Globe className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
                        <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleChange} placeholder="https://your-company.com/brand/logo.png" className="form-control ps-5 text-xs font-semibold rounded-xl"/>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Paste a direct link to your publicly hosted image.
                      </p>
                    </div>)}
                </div>
              </div>
            </div>

            {/* ── GENERAL IDENTITY INPUTS ── */}
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የድርጅት ሙሉ ህጋዊ ስም *' : 'Organization Full Legal Name *'}
                </label>
                <input type="text" name="name" className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={handleChange} placeholder={isAm ? "ምሳሌ፡ አፔክስ ቴክኖሎጂ ኃ/የተ/የግ/ማ" : "e.g. Apex Global Technologies Group"}/>
                {renderFieldError('name')}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'አህጽሮተ ስም / የንግድ መጠሪያ' : 'Short / Brand Display Name'}
                </label>
                <input type="text" name="shortName" className="form-control text-xs font-semibold rounded-xl" value={formData.shortName} onChange={handleChange} placeholder={isAm ? "ምሳሌ፡ አፔክስ" : "e.g. Apex Global"}/>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የድርጅት አጭር መለያ ኮድ *' : 'Organization Short Code *'}
                </label>
                <div className="position-relative">
                  <input type="text" name="code" className={`form-control text-xs font-bold text-uppercase font-monospace rounded-xl ${fieldErrors.code ? 'is-invalid' : codeStatus === 'available' ? 'is-valid' : ''}`} value={formData.code} onChange={handleChange} onBlur={() => checkCodeUniqueness(formData.code)} placeholder="e.g. APX01"/>
                  {codeStatus === 'checking' && (<span className="position-absolute top-50 end-0 translate-middle-y me-3">
                      <span className="spinner-border spinner-border-sm text-secondary"/>
                    </span>)}
                </div>
                {renderFieldError('code')}
                {codeStatus === 'available' && !fieldErrors.code && (<div className="text-success text-xs mt-1 d-flex align-items-center gap-1 fw-semibold">
                    <CheckCircle className="h-3 w-3"/> {isAm ? 'ኮዱ ክፍት ነው!' : 'Code is available!'}
                  </div>)}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'ኦፊሴላዊ የንግድ ምዝገባ ቁጥር *' : 'Official Registration ID / License *'}
                </label>
                <input type="text" name="registrationNumber" className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.registrationNumber ? 'is-invalid' : ''}`} value={formData.registrationNumber} onChange={handleChange} placeholder="e.g. REG-2026-8849"/>
                {renderFieldError('registrationNumber')}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የግብር ከፋይ መለያ ቁጥር (TIN) *' : 'Tax Identification Number (TIN) *'}
                </label>
                <input type="text" name="taxNumber" className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.taxNumber ? 'is-invalid' : ''}`} value={formData.taxNumber} onChange={handleChange} placeholder="e.g. 0019283746"/>
                {renderFieldError('taxNumber')}
              </div>
            </div>
          </div>)}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: OPERATIONAL                                                   */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (<div className="space-y-6">
            <div className="border-bottom pb-3 dark:border-slate-800 d-flex justify-content-between align-items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500"/> {isAm ? '2. የስራ ማስኬጃ ዋና መስሪያ ቤት እና የመገናኛ አድራሻ' : '2. Operational Headquarters & Communications'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAm 
                    ? 'የድርጅት ኢሜይል፣ ስልክ፣ ድረ-ገጽ፣ የአወቃቀር አይነት እና አካላዊ አድራሻን ያዋቅሩ።' 
                    : 'Configure corporate communication inboxes, company structure, and main physical campus coordinates.'}
                </p>
              </div>
            </div>

            <div className="row g-3">
              {/* Communication Channels */}
              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'ኦፊሴላዊ የኢሜይል አድራሻ *' : 'Official Contact Email *'}
                </label>
                <div className="position-relative">
                  <Mail className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
                  <input type="email" name="email" className={`form-control ps-5 text-xs font-semibold rounded-xl ${fieldErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} placeholder="contact@company.com"/>
                </div>
                {renderFieldError('email')}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'ኦፊሴላዊ የስልክ ቁጥር *' : 'Official Phone Number *'}
                </label>
                <div className="position-relative">
                  <Phone className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
                  <input type="text" name="phone" className={`form-control ps-5 text-xs font-semibold rounded-xl ${fieldErrors.phone ? 'is-invalid' : ''}`} value={formData.phone} onChange={handleChange} placeholder="+251 11 661 2233"/>
                </div>
                {renderFieldError('phone')}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የድረ-ገጽ አድራሻ' : 'Website URL'}
                </label>
                <div className="position-relative">
                  <Globe className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
                  <input type="text" name="website" className={`form-control ps-5 text-xs font-semibold rounded-xl ${fieldErrors.website ? 'is-invalid' : ''}`} value={formData.website} onChange={handleChange} placeholder="https://company.com"/>
                </div>
                {renderFieldError('website')}
              </div>

              {/* Business Structure */}
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የንግድ ተቋም መዋቅር አይነት *' : 'Business Entity Structure *'}
                </label>
                <select name="businessType" className="form-select text-xs font-semibold rounded-xl" value={formData.businessType} onChange={handleChange}>
                  <option value="CORPORATION">{isAm ? 'የንግድ ድርጅት / ኮርፖሬሽን' : 'Commercial Enterprise / Corporation'}</option>
                  <option value="FINANCIAL">{isAm ? 'የፋይናንስ ተቋም / ባንክ' : 'Financial Institution / Bank'}</option>
                  <option value="TECHNOLOGY">{isAm ? 'የቴክኖሎጂ እና ፈጠራ ድርጅት' : 'Technology & Innovation Firm'}</option>
                  <option value="GOVERNMENT">{isAm ? 'የመንግስት መስሪያ ቤት / ሚኒስቴር' : 'Government Agency / Ministry'}</option>
                  <option value="HEALTHCARE">{isAm ? 'የጤና ጥበቃ እና ሆስፒታል ተቋም' : 'Healthcare & Hospital Facility'}</option>
                  <option value="NON_PROFIT">{isAm ? 'መንግስታዊ ያልሆነ ድርጅት (NGO)' : 'Non-Governmental Organization (NGO)'}</option>
                  <option value="EDUCATIONAL">{isAm ? 'የትምህርት ተቋም / ዩኒቨርሲቲ' : 'Educational Institution / University'}</option>
                  <option value="OTHER">{isAm ? 'ሌላ' : 'Other Enterprise'}</option>
                </select>
                {renderFieldError('businessType')}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የሚጠበቅ የቀን ከፍተኛ የጎብኝዎች አቅም' : 'Expected Max Daily Visitor Capacity'}
                </label>
                <input type="number" name="maxVisitorCapacity" className="form-control text-xs font-semibold rounded-xl" value={formData.maxVisitorCapacity} onChange={handleChange} placeholder="e.g. 500"/>
              </div>

              {/* Physical Location */}
              <div className="col-12">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                  {isAm ? 'የዋና መ/ቤት የጎዳና አድራሻ እና የህንጻ ዝርዝር *' : 'Headquarters Street Address & Building Details *'}
                </label>
                <textarea name="address" rows={2} className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.address ? 'is-invalid' : ''}`} value={formData.address} onChange={handleChange} placeholder={isAm ? "ምሳሌ፡ ቦሌ መድሃኒዓለም ታወር፣ 4ኛ ፎቅ፣ ቢሮ ቁጥር 402" : "e.g. Bole Medhanialem Tower, 4th Floor, Suite 402"}/>
                {renderFieldError('address')}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">{isAm ? 'ከተማ *' : 'City / District *'}</label>
                <input type="text" name="city" className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.city ? 'is-invalid' : ''}`} value={formData.city} onChange={handleChange}/>
                {renderFieldError('city')}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">{isAm ? 'ክፍለ ከተማ' : 'Sub-City'}</label>
                <input type="text" name="subCity" className="form-control text-xs font-semibold rounded-xl" value={formData.subCity} onChange={handleChange} placeholder="e.g. Bole"/>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">{isAm ? 'ክልል *' : 'Region / State *'}</label>
                <input type="text" name="region" className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.region ? 'is-invalid' : ''}`} value={formData.region} onChange={handleChange}/>
                {renderFieldError('region')}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">{isAm ? 'ሀገር *' : 'Country *'}</label>
                <input type="text" name="country" className={`form-control text-xs font-semibold rounded-xl ${fieldErrors.country ? 'is-invalid' : ''}`} value={formData.country} onChange={handleChange}/>
                {renderFieldError('country')}
              </div>
            </div>
          </div>)}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: SCHEDULE                                                      */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (<div className="space-y-6">
            <div className="border-bottom pb-3 dark:border-slate-800 d-flex justify-content-between align-items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500"/> {isAm ? '3. የስራ መርሃግብር እና የቀን መቁጠሪያዎች' : '3. Operational Schedule & Working Calendars'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAm 
                    ? 'ሳምንታዊ የስራ ቀናት፣ የእንግዳ መቀበያ ሰዓታት፣ ቋንቋ እና የሰዓት ዞንን ያዋቅሩ።' 
                    : 'Configure default weekly operational days, reception hours, localization, and timezones.'}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Working Days Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider d-flex align-items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500"/> {isAm ? 'የስራ ቀናት *' : 'Operational Working Days *'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formData.workingDays.length} {isAm ? 'ቀናት ነቅተዋል' : 'days active'}
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {WORKING_DAYS_LIST.map((day) => {
                const isSelected = formData.workingDays.includes(day.id);
                return (<button type="button" key={day.id} onClick={() => toggleWorkingDay(day.id)} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-400'}`}/>
                        <span>{isAm ? day.amFull : day.full}</span>
                      </button>);
            })}
                </div>
                {renderFieldError('workingDays')}
              </div>

              {/* Hours & Timezone Grid */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">
                    {isAm ? 'የቀን መግቢያ ጅማሮ ሰዓት *' : 'Daily Check-In Start Time *'}
                  </label>
                  <input type="time" name="workingHoursStart" className="form-control text-xs font-semibold rounded-xl" value={formData.workingHoursStart} onChange={handleChange}/>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">
                    {isAm ? 'የቀን መግቢያ ማብቂያ ሰዓት *' : 'Daily Gate Cutoff Time *'}
                  </label>
                  <input type="time" name="workingHoursEnd" className="form-control text-xs font-semibold rounded-xl" value={formData.workingHoursEnd} onChange={handleChange}/>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">
                    {isAm ? 'ዋና የሰዓት ዞን *' : 'Primary Time Zone *'}
                  </label>
                  <select name="timezone" className="form-select text-xs font-semibold rounded-xl" value={formData.timezone} onChange={handleChange}>
                    <option value="Africa/Addis_Ababa">Addis Ababa (EAT, GMT+3)</option>
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <option value="Europe/London">London (GMT / BST)</option>
                    <option value="America/New_York">New York (EST, GMT-5)</option>
                    <option value="Asia/Dubai">Dubai (GST, GMT+4)</option>
                  </select>
                  {renderFieldError('timezone')}
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">
                    {isAm ? 'ነባሪ የገንዘብ ምንዛሬ *' : 'Default Currency *'}
                  </label>
                  <select name="currency" className="form-select text-xs font-semibold rounded-xl" value={formData.currency} onChange={handleChange}>
                    <option value="ETB">{isAm ? 'ብር (ETB) — የኢትዮጵያ ብር' : 'ETB — Ethiopian Birr (Br)'}</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">
                    {isAm ? 'የስርዓቱ ቋንቋ *' : 'System Language *'}
                  </label>
                  <select name="language" className="form-select text-xs font-semibold rounded-xl" value={formData.language} onChange={handleChange}>
                    <option value="en">English (EN)</option>
                    <option value="am">አማርኛ (Amharic)</option>
                    <option value="om">Afaan Oromoo (OM)</option>
                  </select>
                  {renderFieldError('language')}
                </div>

                <div className="col-12">
                  <label className="form-label font-bold text-xxs uppercase text-slate-400">
                    {isAm ? 'የበጀት ዓመት የቀን መቁጠሪያ' : 'Fiscal Calendar Standard'}
                  </label>
                  <select name="fiscalYear" className="form-select text-xs font-semibold rounded-xl" value={formData.fiscalYear} onChange={handleChange}>
                    <option value="July - June (Ethiopian Fiscal Calendar)">{isAm ? 'ሐምሌ - ሰኔ (የኢትዮጵያ የበጀት ዓመት)' : 'July - June (Standard Ethiopian Fiscal Calendar)'}</option>
                    <option value="January - December (Calendar Year)">{isAm ? 'ጥር - ታህሳስ (የጎርጎሮሳውያን የቀን መቁጠሪያ)' : 'January - December (Standard Calendar Year)'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>)}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* STEP 4: REVIEW & CONFIRMATION                                         */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (<div className="space-y-6">
            <div className="border-bottom pb-3 dark:border-slate-800 d-flex justify-content-between align-items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500"/> {isAm ? '4. መረጃዎችን መከለስ እና ማረጋገጥ' : '4. Review & Confirm Registration'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAm 
                    ? 'ከመመዝገብዎ በፊት አርማ፣ ማንነት፣ የስራ ማስኬጃ አድራሻ እና ሰዓታትን ያረጋግጡ።' 
                    : 'Verify the organization logo, identity, operational coordinates, and scheduling before committing.'}
                </p>
              </div>
            </div>

            {/* ── HIGH-IMPACT HERO REVIEW CARD WITH LOGO ── */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 border border-blue-800/40 shadow-xl d-flex flex-column sm:flex-row align-items-center justify-content-between gap-5">
              <div className="d-flex align-items-center gap-4 text-center sm:text-start">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-2 border border-slate-700 shadow-md d-flex align-items-center justify-center shrink-0">
                  {formData.logoUrl ? (<img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain"/>) : (<Building className="w-10 h-10 text-blue-500"/>)}
                </div>
                <div>
                  <div className="d-flex align-items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {formData.name || (isAm ? 'የድርጅት ስም' : 'Organization Name')}
                    </h2>
                    <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono">
                      {isAm ? 'ለምዝገባ ዝግጁ ነው' : 'READY TO REGISTER'}
                    </span>
                  </div>
                  <div className="d-flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-mono font-bold text-blue-400">{isAm ? 'ኮድ' : 'CODE'}: {formData.code || 'N/A'}</span>
                    <span>•</span>
                    <span>TIN: {formData.taxNumber || 'N/A'}</span>
                    <span>•</span>
                    <span>{isAm ? 'ምዝገባ ቁ.' : 'Reg'}: {formData.registrationNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setStep(1)} className="btn btn-outline-primary btn-sm rounded-xl text-xs font-bold px-3 py-1.5">
                {isAm ? 'አርማ / ስም ቀይር' : 'Change Logo / Name'}
              </button>
            </div>

            {/* ── 3 REVIEW BREAKDOWN PANELS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Panel 1: General & Legal */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
                  <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    {isAm ? '1. ህጋዊ መገለጫ' : '1. Legal Profile'}
                  </span>
                  <button type="button" onClick={() => setStep(1)} className="text-blue-500 hover:underline font-bold text-[10px]">
                    {isAm ? 'አርትዕ' : 'Edit'}
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'አህጽሮተ ስም:' : 'Short Name:'}</span> {formData.shortName || (isAm ? 'የለም' : 'None')}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ኮድ:' : 'Code:'}</span> <span className="font-mono font-bold text-blue-400">{formData.code}</span></div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'የምዝገባ መለያ:' : 'Reg ID:'}</span> {formData.registrationNumber}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ቲን:' : 'TIN:'}</span> {formData.taxNumber}</div>
                </div>
              </div>

              {/* Panel 2: Operational Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
                  <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    {isAm ? '2. የስራ ማስኬጃ አድራሻ' : '2. Operational HQ'}
                  </span>
                  <button type="button" onClick={() => setStep(2)} className="text-blue-500 hover:underline font-bold text-[10px]">
                    {isAm ? 'አርትዕ' : 'Edit'}
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ኢሜይል:' : 'Email:'}</span> {formData.email}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ስልክ:' : 'Phone:'}</span> {formData.phone}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ከተማ:' : 'City:'}</span> {formData.city}, {formData.country}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'መዋቅር:' : 'Structure:'}</span> {formData.businessType}</div>
                </div>
              </div>

              {/* Panel 3: Operating Schedule */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
                  <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    {isAm ? '3. የስራ ሰዓት እና መርሃግብር' : '3. Schedule & Hours'}
                  </span>
                  <button type="button" onClick={() => setStep(3)} className="text-blue-500 hover:underline font-bold text-[10px]">
                    {isAm ? 'አርትዕ' : 'Edit'}
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ቀናት:' : 'Days:'}</span> {formData.workingDays.map(d => d.toUpperCase()).join(', ')}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ሰዓታት:' : 'Hours:'}</span> {formData.workingHoursStart} – {formData.workingHoursEnd}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'የሰዓት ዞን:' : 'Timezone:'}</span> {formData.timezone}</div>
                  <div><span className="text-slate-400 font-semibold">{isAm ? 'ምንዛሬ:' : 'Currency:'}</span> {formData.currency}</div>
                </div>
              </div>
            </div>
          </div>)}

        {/* ── FOOTER WIZARD CONTROLS ───────────────────────────────────────────── */}
        <div className="d-flex justify-content-between align-items-center pt-4 border-top dark:border-slate-800">
          {step > 1 ? (<button type="button" onClick={handleBack} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition">
              <ArrowLeft className="h-4 w-4"/> {isAm ? 'ወደ ቀዳሚው ደረጃ ተመለስ' : 'Back to Previous Step'}
            </button>) : (<div />)}

          {step < 4 ? (<button type="button" onClick={handleNext} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition">
              {isAm ? `ወደ ደረጃ ${step + 1} ቀጥል` : `Continue to Step ${step + 1}`} <ArrowRight className="h-4 w-4"/>
            </button>) : (<button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-success d-flex align-items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-xl shadow-emerald-600/30 transition disabled:opacity-50">
              {loading ? (<>
                  <span className="spinner-border spinner-border-sm"/> {isAm ? 'ድርጅቱ በመመዝገብ ላይ...' : 'Registering Organization...'}
                </>) : (<>
                  <Save className="h-4 w-4"/> {isAm ? 'ምዝገባውን አጠናቅቅ እና መዝግብ' : 'Complete & Register Organization'}
                </>)}
            </button>)}
        </div>
      </div>
    </div>);
}
