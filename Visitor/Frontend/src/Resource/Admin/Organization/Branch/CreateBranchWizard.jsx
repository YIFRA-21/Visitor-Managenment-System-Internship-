import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, GitBranch, Phone, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import OperatingHoursForm from './components/OperatingHoursForm';
import { useLanguage } from '../../../../contexts/LanguageContext';
import CountryNationalitySelect from '../../../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../../../components/common/CountryPhoneInput';
import { validatePhoneNumber, parseInternationalPhone } from '../../../../data/countriesData';

export default function CreateBranchWizard() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [codeStatus, setCodeStatus] = useState('idle');
    const [organizations, setOrganizations] = useState([]);

    const [formData, setFormData] = useState({
        branchName: '',
        branchCode: '',
        organizationId: '',
        branchType: 'OFFICE',
        email: '',
        phone: '',
        website: '',
        country: 'Ethiopia',
        region: 'Addis Ababa',
        city: '',
        subCity: '',
        woreda: '',
        postalCode: '',
        address: '',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        openingTime: '08:30',
        closingTime: '17:30',
        timezone: 'Africa/Addis_Ababa',
    });

    useEffect(() => {
        api.get('/organizations/search?limit=100')
            .then(res => {
                const list = res.data.data || res.data || [];
                const activeList = list.filter((org) => (org.status || '').toUpperCase() === 'ACTIVE');
                setOrganizations(activeList);
                if (activeList.length > 0) {
                    setFormData(prev => ({ ...prev, organizationId: prev.organizationId || String(activeList[0].id) }));
                }
            })
            .catch(() => {
                const fallback = [{ id: 1, name: 'IT park', code: 'ITP01', status: 'ACTIVE' }];
                setOrganizations(fallback);
                setFormData(prev => ({ ...prev, organizationId: prev.organizationId || '1' }));
            });
    }, []);

    // Automatically auto-populate country from phone number if country is not set yet
    useEffect(() => {
        if (!formData.country && formData.phone) {
            const parsed = parseInternationalPhone(formData.phone);
            if (parsed?.country?.name) {
                setFormData(prev => ({ ...prev, country: parsed.country.name }));
            }
        }
    }, [formData.phone]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
    };

    const handleHoursChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const checkCodeUniqueness = async (code) => {
        if (!code || code.length < 2) return;
        setCodeStatus('checking');
        try {
            const res = await api.get(`/branches/check-code?code=${encodeURIComponent(code)}`);
            setCodeStatus(res.data.taken ? 'taken' : 'available');
            if (res.data.taken) {
                setFieldErrors(prev => ({ ...prev, branchCode: isAm ? `የቅርንጫፍ መለያ ኮድ '${code}' አስቀድሞ ተይዟል።` : `Code '${code}' is already taken.` }));
            }
        } catch {
            setCodeStatus('idle');
        }
    };

    const validateStep = (s) => {
        const errs = {};
        if (s === 1) {
            if (!formData.branchName.trim()) errs.branchName = isAm ? 'የቅርንጫፍ ስም ያስፈልጋል' : 'Branch Name is required';
            if (!formData.branchCode.trim()) errs.branchCode = isAm ? 'የቅርንጫፍ መለያ ኮድ ያስፈልጋል' : 'Branch Code is required';
            if (!formData.organizationId) errs.organizationId = isAm ? 'ድርጅት መመረጥ አለበት' : 'Organization is required';
        }
        if (s === 2) {
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errs.email = isAm ? 'ትክክለኛ ኢሜይል ያስገቡ' : 'Invalid email address';
            }
            if (formData.phone && formData.phone.trim()) {
                const phoneCheck = validatePhoneNumber(formData.phone);
                if (!phoneCheck.valid && !phoneCheck.isValid) {
                    errs.phone = isAm ? 'ትክክለኛ ስልክ ቁጥር ያስገቡ' : (phoneCheck.error || 'Invalid phone number');
                }
            }
        }
        if (s === 3) {
            let currentCountry = formData.country;
            if (!currentCountry || !String(currentCountry).trim() || String(currentCountry).trim() === '[object Object]') {
                if (formData.phone) {
                    const parsed = parseInternationalPhone(formData.phone);
                    if (parsed?.country?.name) {
                        currentCountry = parsed.country.name;
                        setFormData(prev => ({ ...prev, country: currentCountry }));
                    }
                }
            }
            const cleanCountry = typeof currentCountry === 'string' ? currentCountry.trim()
                : (currentCountry?.target?.value || currentCountry?.name || String(currentCountry || '')).trim();
            if (!cleanCountry || cleanCountry === '[object Object]') {
                errs.country = isAm ? 'ሀገር ያስፈልጋል' : 'Country is required';
            }
            if (!formData.region.trim()) errs.region = isAm ? 'ክልል ያስፈልጋል' : 'Region is required';
            if (!formData.city.trim()) errs.city = isAm ? 'ከተማ ያስፈልጋል' : 'City is required';
            if (!formData.address.trim()) errs.address = isAm ? 'የመንገድ ወይም የህንፃ አድራሻ ያስፈልጋል' : 'Address is required';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(s => s + 1);
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(step)) return;
        setLoading(true);
        setError('');
        try {
            await api.post('/branches', formData);
            const p = new URLSearchParams(window.location.search);
            p.set('view', 'branches');
            window.location.search = `?${p.toString()}`;
        } catch (err) {
            setError(err.response?.data?.error || (isAm ? 'ቅርንጫፉን መመዝገብ አልተቻለም።' : 'Failed to create branch'));
        } finally {
            setLoading(false);
        }
    };

    const renderFieldError = (fieldName) => {
        if (!fieldErrors[fieldName]) return null;
        return (
            <div className="text-danger text-xs mt-1 d-flex align-items-center gap-1 fw-semibold">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors[fieldName]}
            </div>
        );
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="d-flex align-items-center gap-3">
                <button onClick={() => { const p = new URLSearchParams(window.location.search); p.set('view', 'branches'); window.location.search = `?${p.toString()}`; }} className="btn btn-outline-secondary btn-sm p-2">
                    <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
                        <GitBranch className="text-blue-600 h-7 w-7" />
                        <span>{isAm ? 'የቅርንጫፍ መመዝገቢያ ቅጽ (Wizard)' : 'Branch Registration Wizard'}</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
                        {isAm ? 'አዲስ የድርጅት ቅርንጫፍ ለመመዝገብ ከዚህ በታች ያሉትን ደረጃዎች ይከተሉ።' : 'Follow the steps below to register a new branch location.'}
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                    {[
                        { label: isAm ? 'መደበኛ መረጃ' : 'General', icon: GitBranch, num: 1 },
                        { label: isAm ? 'እውቂያ' : 'Contact', icon: Phone, num: 2 },
                        { label: isAm ? 'አድራሻ' : 'Address', icon: MapPin, num: 3 },
                        { label: isAm ? 'የሥራ ሰዓት' : 'Hours', icon: Clock, num: 4 },
                        { label: isAm ? 'ማጠቃለያ' : 'Review', icon: CheckCircle, num: 5 },
                    ].map(s => (
                        <div key={s.num} className="d-flex flex-column align-items-center z-1">
                            <div className={`h-8 w-8 rounded-full d-flex align-items-center justify-content-center font-bold text-xs ${step >= s.num ? 'bg-primary text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                {s.num}
                            </div>
                            <span className={`text-[10px] font-bold mt-1.5 uppercase ${step >= s.num ? 'text-primary' : 'text-slate-400'}`}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {error && <div className="alert alert-danger text-xs font-semibold py-2.5 d-flex align-items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

            {/* Content */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                {/* Step 1 */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800">
                            {isAm ? 'አጠቃላይ የቅርንጫፉ መረጃ' : 'General Information'}
                        </h4>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'የቅርንጫፍ ስም *' : 'Branch Name *'}
                                </label>
                                <input type="text" name="branchName" className={`form-control text-xs font-semibold ${fieldErrors.branchName ? 'is-invalid' : ''}`} value={formData.branchName} onChange={handleChange} placeholder={isAm ? 'ምሳሌ፡ ቦሌ ዋና ቅርንጫፍ' : 'e.g. Bole HQ Office'} />
                                {renderFieldError('branchName')}
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'የቅርንጫፍ ኮድ *' : 'Branch Code *'}
                                </label>
                                <div className="position-relative">
                                    <input type="text" name="branchCode" className={`form-control text-xs font-semibold text-uppercase font-monospace ${fieldErrors.branchCode ? 'is-invalid' : codeStatus === 'available' ? 'is-valid' : ''}`} value={formData.branchCode} onChange={handleChange} onBlur={() => checkCodeUniqueness(formData.branchCode)} placeholder="BOL-001" />
                                    {codeStatus === 'checking' && <span className="position-absolute top-50 end-0 translate-middle-y me-2"><span className="spinner-border spinner-border-sm text-secondary" /></span>}
                                </div>
                                {renderFieldError('branchCode')}
                                {codeStatus === 'available' && !fieldErrors.branchCode && <div className="text-success text-xs mt-1 d-flex align-items-center gap-1 fw-semibold"><CheckCircle className="h-3 w-3" /> {isAm ? 'ኮዱ ክፍት ነው' : 'Available'}</div>}
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'የቅርንጫፍ ዓይነት *' : 'Branch Type *'}
                                </label>
                                <select name="branchType" className="form-select text-xs font-semibold" value={formData.branchType} onChange={handleChange}>
                                    <option value="HEADQUARTERS">{isAm ? 'ዋና መሥሪያ ቤት (Headquarters)' : 'Headquarters'}</option>
                                    <option value="OFFICE">{isAm ? 'መደበኛ ቢሮ (Office)' : 'Office'}</option>
                                    <option value="CAMPUS">{isAm ? 'ግቢ / ካምፓስ (Campus)' : 'Campus'}</option>
                                    <option value="RETAIL">{isAm ? 'የችርቻሮ ማዕከል (Retail)' : 'Retail'}</option>
                                    <option value="WAREHOUSE">{isAm ? 'መጋዘን (Warehouse)' : 'Warehouse'}</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ዋና ድርጅት *' : 'Parent Organization *'}
                                </label>
                                <select name="organizationId" className={`form-select text-xs font-semibold ${fieldErrors.organizationId ? 'is-invalid' : ''}`} value={formData.organizationId} onChange={handleChange}>
                                    <option value="">{isAm ? 'ድርጅት ይምረጡ...' : 'Select Organization...'}</option>
                                    {organizations.map((org) => <option key={org.id} value={org.id}>{org.name} ({org.code})</option>)}
                                </select>
                                {renderFieldError('organizationId')}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800">
                            {isAm ? 'የእውቂያ መረጃ' : 'Contact Information'}
                        </h4>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'የኢሜይል አድራሻ' : 'Email Address'}
                                </label>
                                <input type="email" name="email" className={`form-control text-xs font-semibold ${fieldErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} placeholder="branch@company.com" />
                                {renderFieldError('email')}
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ስልክ ቁጥር' : 'Phone Number'}
                                </label>
                                <CountryPhoneInput
                                    id="branch-phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={(val) => {
                                        // Extract string from synthetic event object
                                        const phoneStr = typeof val === 'string' ? val
                                          : (val?.target?.value || val?.value || String(val || ''));
                                        setFormData(prev => ({ ...prev, phone: phoneStr }));
                                        if (fieldErrors.phone) {
                                            setFieldErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                                        }
                                    }}
                                    error={fieldErrors.phone}
                                    placeholder={isAm ? 'የስልክ ቁጥር ያስገቡ' : 'e.g. 0911234567'}
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ድረ-ገጽ (Website)' : 'Website'}
                                </label>
                                <input type="text" name="website" className={`form-control text-xs font-semibold ${fieldErrors.website ? 'is-invalid' : ''}`} value={formData.website} onChange={handleChange} placeholder="https://..." />
                                {renderFieldError('website')}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800">
                            {isAm ? 'የአድራሻ እና የቦታ መረጃ' : 'Address & Location'}
                        </h4>
                        <div className="row g-3">
                            <div className="col-12 col-md-4">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ሀገር *' : 'Country *'}
                                </label>
                                <CountryNationalitySelect
                                    id="branch-country"
                                    name="country"
                                    value={formData.country}
                                    phone={formData.phone}
                                    autoDetectFromPhone={true}
                                    returnMode="country"
                                    onChange={(val) => {
                                        const countryStr = typeof val === 'string' ? val
                                          : (val?.target?.value || val?.value || val?.name || String(val || ''));
                                        setFormData(prev => ({ ...prev, country: countryStr }));
                                        if (fieldErrors.country) {
                                            setFieldErrors(prev => { const n = { ...prev }; delete n.country; return n; });
                                        }
                                    }}
                                    error={fieldErrors.country}
                                    placeholder={isAm ? 'ሀገር ይምረጡ...' : 'Select Country...'}
                                />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ክልል *' : 'Region *'}
                                </label>
                                <input type="text" name="region" className={`form-control text-xs font-semibold ${fieldErrors.region ? 'is-invalid' : ''}`} value={formData.region} onChange={handleChange} />
                                {renderFieldError('region')}
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ከተማ *' : 'City *'}
                                </label>
                                <input type="text" name="city" className={`form-control text-xs font-semibold ${fieldErrors.city ? 'is-invalid' : ''}`} value={formData.city} onChange={handleChange} />
                                {renderFieldError('city')}
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ክፍለ ከተማ' : 'Sub-City'}
                                </label>
                                <input type="text" name="subCity" className="form-control text-xs font-semibold" value={formData.subCity} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ወረዳ' : 'Woreda'}
                                </label>
                                <input type="text" name="woreda" className="form-control text-xs font-semibold" value={formData.woreda} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'የፖስታ ሣጥን ቁጥር' : 'Postal Code'}
                                </label>
                                <input type="text" name="postalCode" className="form-control text-xs font-semibold" value={formData.postalCode} onChange={handleChange} />
                            </div>
                            <div className="col-12">
                                <label className="form-label font-bold text-xxs uppercase text-slate-400">
                                    {isAm ? 'ሙሉ የመንገድ / የህንፃ አድራሻ *' : 'Full Street Address *'}
                                </label>
                                <textarea name="address" className={`form-control text-xs font-semibold ${fieldErrors.address ? 'is-invalid' : ''}`} rows={2} value={formData.address} onChange={handleChange} placeholder={isAm ? 'ህንፃ፣ መንገድ፣ አካባቢ...' : 'Building, Street, Area...'} />
                                {renderFieldError('address')}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800">
                            {isAm ? 'የሥራ ሰዓቶች' : 'Operating Hours'}
                        </h4>
                        <OperatingHoursForm workingDays={formData.workingDays} openingTime={formData.openingTime} closingTime={formData.closingTime} timezone={formData.timezone} onChange={handleHoursChange} errors={fieldErrors} />
                    </div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                    <div className="space-y-6">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800">
                            {isAm ? 'የቅርንጫፉን መረጃ ያረጋግጡ' : 'Confirm Branch Details'}
                        </h4>
                        <div className="space-y-4">
                            {/* General */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-1.5 dark:border-slate-800">
                                    <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white">
                                        {isAm ? '1. መደበኛ መረጃ' : '1. General Information'}
                                    </span>
                                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline-primary btn-xs py-0.5 px-2 text-[9px] font-bold">
                                        {isAm ? 'አስተካክል' : 'Edit'}
                                    </button>
                                </div>
                                <div className="row g-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <div className="col-6"><p className="mb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ስም:' : 'Name:'}</span> {formData.branchName}</p></div>
                                    <div className="col-3"><p className="mb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ኮድ:' : 'Code:'}</span> {formData.branchCode}</p></div>
                                    <div className="col-3"><p className="mb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ዓይነት:' : 'Type:'}</span> {formData.branchType}</p></div>
                                    <div className="col-12"><p className="mb-0"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ድርጅት:' : 'Organization:'}</span> {organizations.find((o) => String(o.id) === String(formData.organizationId))?.name || 'N/A'}</p></div>
                                </div>
                            </div>
                            {/* Contact */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-1.5 dark:border-slate-800">
                                    <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white">
                                        {isAm ? '2. እውቂያ' : '2. Contact'}
                                    </span>
                                    <button type="button" onClick={() => setStep(2)} className="btn btn-outline-primary btn-xs py-0.5 px-2 text-[9px] font-bold">
                                        {isAm ? 'አስተካክል' : 'Edit'}
                                    </button>
                                </div>
                                <div className="row g-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <div className="col-4"><p className="mb-0"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ኢሜይል:' : 'Email:'}</span> {formData.email || 'N/A'}</p></div>
                                    <div className="col-4"><p className="mb-0"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ስልክ:' : 'Phone:'}</span> {formData.phone || 'N/A'}</p></div>
                                    <div className="col-4"><p className="mb-0"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ድረ-ገጽ:' : 'Website:'}</span> {formData.website || 'N/A'}</p></div>
                                </div>
                            </div>
                            {/* Address */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-1.5 dark:border-slate-800">
                                    <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white">
                                        {isAm ? '3. አድራሻ' : '3. Address'}
                                    </span>
                                    <button type="button" onClick={() => setStep(3)} className="btn btn-outline-primary btn-xs py-0.5 px-2 text-[9px] font-bold">
                                        {isAm ? 'አስተካክል' : 'Edit'}
                                    </button>
                                </div>
                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <p className="mb-0"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ቦታ:' : 'Location:'}</span> {formData.address}, {formData.city}, {formData.region}, {formData.country}</p>
                                </div>
                            </div>
                            {/* Hours */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-1.5 dark:border-slate-800">
                                    <span className="text-[10px] font-extrabold uppercase text-slate-900 dark:text-white">
                                        {isAm ? '4. የሥራ ሰዓታት' : '4. Operating Hours'}
                                    </span>
                                    <button type="button" onClick={() => setStep(4)} className="btn btn-outline-primary btn-xs py-0.5 px-2 text-[9px] font-bold">
                                        {isAm ? 'አስተካክል' : 'Edit'}
                                    </button>
                                </div>
                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <p className="mb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ቀናት:' : 'Days:'}</span> {formData.workingDays.join(', ')}</p>
                                    <p className="mb-0"><span className="text-slate-400 font-bold uppercase text-[9px]">{isAm ? 'ሰዓት:' : 'Schedule:'}</span> {formData.openingTime} — {formData.closingTime} ({formData.timezone})</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between mt-8 border-top pt-4 dark:border-slate-800">
                    {step > 1 ? (
                        <button onClick={handleBack} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2">
                            <ArrowLeft className="h-4.5 w-4.5" /> {isAm ? 'ተመለስ' : 'Back'}
                        </button>
                    ) : <div />}
                    {step < 5 ? (
                        <button onClick={handleNext} className="btn btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-4 py-2">
                            {isAm ? 'ቀጣይ ደረጃ' : 'Next'} <ArrowRight className="h-4.5 w-4.5" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="btn btn-success d-flex align-items-center gap-1.5 text-xs font-bold px-4 py-2">
                            {loading ? (isAm ? 'በማስገባት ላይ...' : 'Submitting...') : (isAm ? 'ቅርንጫፉን መዝግብ' : 'Register Branch')} <Save className="h-4.5 w-4.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
