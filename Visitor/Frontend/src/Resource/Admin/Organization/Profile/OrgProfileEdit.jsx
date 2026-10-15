import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, RotateCcw, X, Building, Mail, Globe, MapPin, Briefcase, CheckCircle, AlertCircle, Upload, Camera, Trash2 } from 'lucide-react';
import api from '../../../../services/api';
import { useOrganization } from '../../../../contexts/OrganizationContext';
const INITIAL_FORM = {
    name: '', shortName: '', code: '', registrationNumber: '', taxNumber: '',
    email: '', phone: '', website: '',
    address: '', city: '', region: 'Addis Ababa', country: 'Ethiopia',
    subCity: '', woreda: '', postalCode: '',
    businessType: 'CORPORATION', timezone: 'Africa/Addis_Ababa', language: 'en',
    logoUrl: '',
};
// Corporate logo presets for instant selection
const PRESET_LOGOS = [
    { id: 'tech', label: 'Tech & AI', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80', gradient: 'from-blue-600 to-indigo-600', letter: 'TX' },
    { id: 'finance', label: 'Finance & Bank', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160&auto=format&fit=crop&q=80', gradient: 'from-emerald-600 to-teal-600', letter: 'FN' },
    { id: 'health', label: 'Healthcare', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=160&auto=format&fit=crop&q=80', gradient: 'from-rose-600 to-pink-600', letter: 'HC' },
    { id: 'enterprise', label: 'Enterprise HQ', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80', gradient: 'from-purple-600 to-indigo-700', letter: 'HQ' },
    { id: 'global', label: 'Global Trade', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=160&auto=format&fit=crop&q=80', gradient: 'from-amber-600 to-orange-600', letter: 'GL' },
];
export default function OrgProfileEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get('orgId');
    const isNew = !orgId;
    const { refreshOrganization, updateLocalOrganization } = useOrganization();
    const [formData, setFormData] = useState({ ...INITIAL_FORM });
    const [originalData, setOriginalData] = useState({ ...INITIAL_FORM });
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [savingLogo, setSavingLogo] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [codeStatus, setCodeStatus] = useState('idle');
    const [logoInputType, setLogoInputType] = useState('upload');
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (orgId)
            fetchOrg();
    }, [orgId]);
    const fetchOrg = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/organizations/${orgId}`);
            const org = res.data;
            const mapped = {
                name: org.name || '',
                shortName: org.short_name || '',
                code: org.code || '',
                registrationNumber: org.registration_number || '',
                taxNumber: org.tax_number || '',
                email: org.email || '',
                phone: org.phone || '',
                website: org.website || '',
                address: org.address || '',
                city: org.city || '',
                region: org.region || 'Addis Ababa',
                country: org.country || 'Ethiopia',
                subCity: org.sub_city || '',
                woreda: org.woreda || '',
                postalCode: org.postal_code || '',
                businessType: org.business_type || 'CORPORATION',
                timezone: org.timezone || 'Africa/Addis_Ababa',
                language: org.language || 'en',
                logoUrl: org.logo_url || org.logoUrl || '',
            };
            setFormData(mapped);
            setOriginalData(mapped);
        }
        catch (err) {
            showToast('error', 'Failed to load organization data.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
    };
    // Handle Logo Upload (File to Data URL)
    const handleLogoFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'Logo image must be smaller than 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFormData(prev => ({ ...prev, logoUrl: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };
    const checkCodeUniqueness = async (code) => {
        if (!code || code.length < 3)
            return;
        setCodeStatus('checking');
        try {
            const res = await api.get(`/organizations/check-code?code=${encodeURIComponent(code)}${orgId ? `&excludeId=${orgId}` : ''}`);
            setCodeStatus(res.data.taken ? 'taken' : 'available');
            if (res.data.taken) {
                setErrors(prev => ({ ...prev, code: `Code '${code}' is already in use.` }));
            }
            else {
                setErrors(prev => { const n = { ...prev }; delete n.code; return n; });
            }
        }
        catch {
            setCodeStatus('idle');
        }
    };
    const validate = () => {
        const newErrors = {};
        // General
        if (!formData.name || formData.name.trim().length < 3) {
            newErrors.name = 'Organization Name is required (min 3 characters).';
        }
        if (!formData.code || !/^[A-Z0-9]{3,10}$/.test(formData.code)) {
            newErrors.code = 'Code must be uppercase alphanumeric, 3–10 characters.';
        }
        if (!formData.registrationNumber || formData.registrationNumber.trim().length === 0) {
            newErrors.registrationNumber = 'Registration Number is required.';
        }
        if (!formData.taxNumber || formData.taxNumber.trim().length === 0) {
            newErrors.taxNumber = 'Tax Number (TIN) is required.';
        }
        // Contact
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Valid email address is required.';
        }
        if (!formData.phone || formData.phone.trim().length === 0) {
            newErrors.phone = 'Phone number is required.';
        }
        if (formData.website && !/^https?:\/\/.+/i.test(formData.website)) {
            if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(formData.website)) {
                // Auto-fix if missing protocol
                formData.website = `https://${formData.website.trim()}`;
            }
            else {
                newErrors.website = 'Website must be a valid URL (https://...).';
            }
        }
        // Address
        if (!formData.address || formData.address.trim().length === 0) {
            newErrors.address = 'Address is required.';
        }
        if (!formData.city || formData.city.trim().length === 0) {
            newErrors.city = 'City is required.';
        }
        // Code uniqueness
        if (codeStatus === 'taken') {
            newErrors.code = `Code '${formData.code}' is already in use.`;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleQuickUpdateLogo = async () => {
        if (!orgId)
            return;
        if (!formData.logoUrl) {
            showToast('error', 'Please choose or upload a logo before updating.');
            return;
        }
        setSavingLogo(true);
        try {
            // Only send logo-related fields to avoid SQL column errors with
            // fields like sub_city that may not exist in the organizations table
            await api.put(`/organizations/${orgId}/branding`, {
                logoUrl: formData.logoUrl,
            });
            updateLocalOrganization({ logoUrl: formData.logoUrl });
            refreshOrganization();
            showToast('success', 'Organization logo updated successfully! Returning to list...');
            setOriginalData(prev => ({ ...prev, logoUrl: formData.logoUrl }));
            setTimeout(() => {
                handleNav('organizations');
            }, 800);
        }
        catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to update logo.';
            showToast('error', msg);
        }
        finally {
            setSavingLogo(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate())
            return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                logo_url: formData.logoUrl,
                logoUrl: formData.logoUrl,
            };
            if (isNew) {
                await api.post('/organizations', payload);
                refreshOrganization();
                showToast('success', 'Organization created successfully.');
            }
            else {
                await api.put(`/organizations/${orgId}`, payload);
                // Also sync branding if logo is modified
                if (formData.logoUrl !== originalData.logoUrl) {
                    try {
                        await api.put(`/organizations/${orgId}/branding`, {
                            logoUrl: formData.logoUrl,
                        });
                    }
                    catch {
                        // Non-critical
                    }
                }
                updateLocalOrganization({
                    name: formData.name,
                    shortName: formData.shortName,
                    email: formData.email,
                    phone: formData.phone,
                    website: formData.website,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    subCity: formData.subCity,
                    woreda: formData.woreda,
                    postalCode: formData.postalCode,
                    logoUrl: formData.logoUrl,
                });
                refreshOrganization();
                showToast('success', 'Organization profile & logo updated successfully!');
            }
            setOriginalData({ ...formData });
            // Navigate back to list after short delay
            setTimeout(() => handleNav('organizations'), 1000);
        }
        catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to save organization.';
            showToast('error', msg);
        }
        finally {
            setSaving(false);
        }
    };
    const handleReset = () => {
        setFormData({ ...originalData });
        setErrors({});
        setCodeStatus('idle');
    };
    const handleNav = (view) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        params.delete('orgId');
        window.location.search = `?${params.toString()}`;
    };
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };
    const renderFieldError = (fieldName) => {
        if (!errors[fieldName])
            return null;
        return (<div className="text-danger text-xs mt-1 d-flex align-items-center gap-1 fw-semibold">
        <AlertCircle className="h-3 w-3"/>
        {errors[fieldName]}
      </div>);
    };
    if (loading) {
        return (<div className="org-profile-edit">
        <div className="p-20 text-center">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Loading organization data...</p>
        </div>
      </div>);
    }
    return (<div className="org-profile-edit max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast Alert */}
      {toast && (<div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${toast.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/90 border border-rose-800 text-rose-300'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5"/>
          </button>
        </div>)}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="d-flex align-items-center gap-3">
          <button type="button" onClick={() => handleNav('organizations')} className="btn btn-outline-secondary btn-sm p-2 rounded-xl" title="Back to Organizations">
            <ArrowLeft className="h-4 w-4"/>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Building className="text-blue-600 h-7 w-7"/>
              {isNew ? 'Register New Organization' : 'Edit Organization Profile'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 fw-semibold">
              {isNew ? 'Complete all required fields to register a new organization.' : `Update logo/profile picture, operational identity, and coordinates for ${formData.name || 'organization'}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── LOGO / PROFILE PICTURE UPDATE HERO CARD ────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="d-flex justify-content-between align-items-center border-b pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white d-flex align-items-center gap-2">
                <Camera className="w-4.5 h-4.5 text-blue-500"/> Organization Logo & Profile Picture
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update the official corporate logo displayed across visitor badges, check-in kiosks, and reports.
              </p>
            </div>

            {/* Input Mode Selector */}
            <div className="d-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
              <button type="button" onClick={() => setLogoInputType('upload')} className={`px-2.5 py-1 rounded-lg transition ${logoInputType === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                File Upload
              </button>
              <button type="button" onClick={() => setLogoInputType('preset')} className={`px-2.5 py-1 rounded-lg transition ${logoInputType === 'preset' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                Presets
              </button>
              <button type="button" onClick={() => setLogoInputType('url')} className={`px-2.5 py-1 rounded-lg transition ${logoInputType === 'url' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                Image URL
              </button>
            </div>
          </div>

          <div className="d-flex flex-column sm:flex-row align-items-start sm:align-items-center gap-5 pt-2">
            {/* Live Logo Preview Box */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 d-flex align-items-center justify-center overflow-hidden shadow-inner">
                {formData.logoUrl ? (<img src={formData.logoUrl} alt="Organization Logo" className="w-full h-full object-contain p-1.5" onError={(e) => {
                e.target.style.display = 'none';
            }}/>) : (<div className="d-flex flex-column align-items-center justify-center text-slate-400 text-center p-2">
                    <Building className="w-8 h-8 text-blue-500/70 mb-1"/>
                    <span className="text-[9px] font-bold uppercase tracking-wider">No Logo</span>
                  </div>)}
              </div>

              {formData.logoUrl && (<button type="button" onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))} className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-500 transition" title="Remove Logo">
                  <X className="w-3.5 h-3.5"/>
                </button>)}
            </div>

            {/* Upload & Choose Controls */}
            <div className="flex-1 w-full space-y-3">
              {logoInputType === 'upload' && (<div className="space-y-2">
                  <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoFileUpload} className="d-none"/>
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl">
                      <Upload className="w-3.5 h-3.5"/> Choose New Image (PNG / JPG / SVG)
                    </button>
                    {formData.logoUrl && (<button type="button" onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl">
                        <Trash2 className="w-3.5 h-3.5"/> Remove Logo
                      </button>)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: 512x512 transparent PNG or SVG vector. Max file size: 2MB.
                  </p>
                </div>)}

              {logoInputType === 'preset' && (<div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pick a modern corporate emblem preset:
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {PRESET_LOGOS.map((preset) => (<button type="button" key={preset.id} onClick={() => setFormData(prev => ({ ...prev, logoUrl: preset.url }))} className={`d-flex align-items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${formData.logoUrl === preset.url
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                        <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${preset.gradient} text-white font-mono text-[9px] d-flex items-center justify-center font-black`}>
                          {preset.letter}
                        </span>
                        <span>{preset.label}</span>
                      </button>))}
                  </div>
                </div>)}

              {logoInputType === 'url' && (<div className="space-y-2">
                  <div className="position-relative">
                    <Globe className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4 w-4"/>
                    <input type="url" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} placeholder="https://your-company.com/brand/logo.png" className="form-control ps-5 text-xs font-semibold rounded-xl"/>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Paste an image URL hosted on your company website or CDN.
                  </p>
                </div>)}
            </div>
          </div>

          {/* Quick Actions for Logo */}
          {!isNew && (<div className="pt-3 border-t border-slate-100 dark:border-slate-800 d-flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {formData.logoUrl !== originalData.logoUrl
                ? '✨ New logo chosen. Click "Update Logo & Return to List" to save immediately.'
                : 'Current organization logo active.'}
              </span>
              <button type="button" onClick={handleQuickUpdateLogo} disabled={savingLogo || !formData.logoUrl} className="btn btn-primary btn-sm d-flex align-items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20">
                {savingLogo ? (<>
                    <span className="spinner-border spinner-border-sm"/> Updating Logo...
                  </>) : (<>
                    <Save className="w-3.5 h-3.5"/> Update Logo & Return to List
                  </>)}
              </button>
            </div>)}
        </div>

        {/* ── SECTION 1: GENERAL INFORMATION ─────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Building className="h-4.5 w-4.5 text-blue-500"/>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              General Enterprise Information
            </h3>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Organization Name *</label>
              <input type="text" name="name" className={`form-control text-xs fw-semibold rounded-xl ${errors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={handleChange} placeholder="Enter organization name"/>
              {renderFieldError('name')}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Short / Brand Name</label>
              <input type="text" name="shortName" className="form-control text-xs fw-semibold rounded-xl" value={formData.shortName} onChange={handleChange} placeholder="Abbreviation or alias"/>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Organization Code *</label>
              <div className="position-relative">
                <input type="text" name="code" className={`form-control text-xs fw-semibold font-monospace text-uppercase rounded-xl ${errors.code ? 'is-invalid' : codeStatus === 'available' ? 'is-valid' : ''}`} value={formData.code} onChange={(e) => { handleChange(e); }} onBlur={() => checkCodeUniqueness(formData.code)} placeholder="E.g. ACME01"/>
                {codeStatus === 'checking' && (<span className="position-absolute top-50 end-0 translate-middle-y me-2">
                    <span className="spinner-border spinner-border-sm text-secondary"/>
                  </span>)}
              </div>
              {renderFieldError('code')}
              {codeStatus === 'available' && !errors.code && (<div className="text-success text-xs mt-1 d-flex align-items-center gap-1 fw-semibold">
                  <CheckCircle className="h-3 w-3"/> Code is available
                </div>)}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Registration Number *</label>
              <input type="text" name="registrationNumber" className={`form-control text-xs fw-semibold rounded-xl ${errors.registrationNumber ? 'is-invalid' : ''}`} value={formData.registrationNumber} onChange={handleChange} placeholder="Business registration #"/>
              {renderFieldError('registrationNumber')}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Tax ID (TIN) *</label>
              <input type="text" name="taxNumber" className={`form-control text-xs fw-semibold rounded-xl ${errors.taxNumber ? 'is-invalid' : ''}`} value={formData.taxNumber} onChange={handleChange} placeholder="10-12 digit TIN"/>
              {renderFieldError('taxNumber')}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: CONTACT INFORMATION ─────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Mail className="h-4.5 w-4.5 text-emerald-500"/>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Contact & Communication
            </h3>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Email *</label>
              <input type="email" name="email" className={`form-control text-xs fw-semibold rounded-xl ${errors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} placeholder="org@example.com"/>
              {renderFieldError('email')}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Phone *</label>
              <input type="tel" name="phone" className={`form-control text-xs fw-semibold rounded-xl ${errors.phone ? 'is-invalid' : ''}`} value={formData.phone} onChange={handleChange} placeholder="+251911000000"/>
              {renderFieldError('phone')}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Website</label>
              <input type="url" name="website" className={`form-control text-xs fw-semibold rounded-xl ${errors.website ? 'is-invalid' : ''}`} value={formData.website} onChange={handleChange} placeholder="https://www.example.com"/>
              {renderFieldError('website')}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: ADDRESS INFORMATION ─────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-b pb-3 dark:border-slate-800">
            <MapPin className="h-4.5 w-4.5 text-amber-500"/>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Address & Headquarters Location
            </h3>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Country *</label>
              <input type="text" name="country" className="form-control text-xs fw-semibold rounded-xl" value={formData.country} onChange={handleChange}/>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Region *</label>
              <input type="text" name="region" className="form-control text-xs fw-semibold rounded-xl" value={formData.region} onChange={handleChange}/>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">City *</label>
              <input type="text" name="city" className={`form-control text-xs fw-semibold rounded-xl ${errors.city ? 'is-invalid' : ''}`} value={formData.city} onChange={handleChange}/>
              {renderFieldError('city')}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Sub-City</label>
              <input type="text" name="subCity" className="form-control text-xs fw-semibold rounded-xl" value={formData.subCity} onChange={handleChange}/>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Woreda</label>
              <input type="text" name="woreda" className="form-control text-xs fw-semibold rounded-xl" value={formData.woreda} onChange={handleChange}/>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Postal Code</label>
              <input type="text" name="postalCode" className="form-control text-xs fw-semibold rounded-xl" value={formData.postalCode} onChange={handleChange}/>
            </div>
            <div className="col-12">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Street Address *</label>
              <textarea name="address" rows={2} className={`form-control text-xs fw-semibold rounded-xl ${errors.address ? 'is-invalid' : ''}`} value={formData.address} onChange={handleChange} placeholder="Street address or building details"/>
              {renderFieldError('address')}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: BUSINESS PROFILE & LOCALIZATION ─────────────────────── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-b pb-3 dark:border-slate-800">
            <Briefcase className="h-4.5 w-4.5 text-purple-500"/>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Business Structure & Settings
            </h3>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Business Type</label>
              <select name="businessType" className="form-select text-xs fw-semibold rounded-xl" value={formData.businessType} onChange={handleChange}>
                <option value="CORPORATION">Corporation</option>
                <option value="LLC">LLC</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                <option value="NON_PROFIT">Non-Profit</option>
                <option value="GOVERNMENT">Government Agency</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Timezone</label>
              <select name="timezone" className="form-select text-xs fw-semibold rounded-xl" value={formData.timezone} onChange={handleChange}>
                <option value="Africa/Addis_Ababa">Addis Ababa (EAT, UTC+3)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">New York (EST, UTC-5)</option>
                <option value="Europe/London">London (GMT, UTC+0)</option>
                <option value="Asia/Dubai">Dubai (GST, UTC+4)</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-xs fw-bold text-slate-600 dark:text-slate-300">Language</label>
              <select name="language" className="form-select text-xs fw-semibold rounded-xl" value={formData.language} onChange={handleChange}>
                <option value="en">English (EN)</option>
                <option value="am">Amharic (አማርኛ)</option>
                <option value="om">Afaan Oromoo (OM)</option>
                <option value="fr">French (FR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ─────────────────────────────────────────────────── */}
        <div className="d-flex justify-content-between align-items-center pt-3 border-t dark:border-slate-800">
          <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs fw-bold px-4 py-2.5 rounded-xl" onClick={() => handleNav('organizations')}>
            <X className="h-4 w-4"/> Cancel
          </button>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-warning d-flex align-items-center gap-2 text-xs fw-bold px-4 py-2.5 rounded-xl" onClick={handleReset}>
              <RotateCcw className="h-4 w-4"/> Reset
            </button>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/25" disabled={saving}>
              {saving ? (<><span className="spinner-border spinner-border-sm"/> Saving Changes...</>) : (<><Save className="h-4 w-4"/> {isNew ? 'Create Organization' : 'Save Changes & Update Logo'}</>)}
            </button>
          </div>
        </div>
      </form>
    </div>);
}
