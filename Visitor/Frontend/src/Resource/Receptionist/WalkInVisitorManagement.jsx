import React, { useState, useEffect, useMemo } from 'react';
import { 
    User, Mail, MapPin, Briefcase, Phone, Car, Camera, FileText, CheckSquare, 
    CheckCircle, CheckCircle2, AlertCircle, Printer, ChevronLeft, ChevronRight, 
    Send, Building, Upload, BadgeCheck, Laptop, Search, Filter, RefreshCw, 
    Eye, Edit3, Trash2, Key, UserCheck, X, Shield, Clock, QrCode, Calendar,
    ExternalLink, Sparkles, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import CountryNationalitySelect from '../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../components/common/CountryPhoneInput';
import { validateDateOfBirth, validatePhoneNumber } from '../../data/countriesData';
import { resolvePhotoUrl } from '../../utils/photoUtils';

const maxAllowedDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

export default function WalkInVisitorManagement({ onNavigate }) {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    // Dynamic Organization Context
    const { organization, logoUrl: orgLogoUrl, orgName: organizationName } = useOrganization();
    const companyLogo = orgLogoUrl || organization?.logoUrl || '/logo.png';
    const companyName = organizationName || organization?.name || 'Acme Enterprise';

    // Top View Switcher ('register' | 'history')
    const [activeTab, setActiveTab] = useState('register');

    // ── 10-STEP WIZARD STATE ──
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [hosts, setHosts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [registeredResult, setRegisteredResult] = useState(null);

    // Validation Errors state
    const [errors, setErrors] = useState({});

    // Wizard Form Data (all required fields start empty so validation triggers properly on empty submission)
    const [form, setForm] = useState({
        // Step 1: Personal
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        nationality: '',
        marital_status: '',
        phonePrefix: '+251',
        // Step 2: Contact
        phone: '',
        email: '',
        company: '',
        job_title: '',
        // Step 3: Address
        subcity: '',
        woreda: '',
        house_number: '',
        city: '',
        // Step 4: Visit & Host
        department_id: '',
        host_id: '',
        visitor_category: '',
        visit_purpose: '',
        expected_duration: '',
        // Step 5: Emergency
        emergency_name: '',
        emergency_phone: '',
        emergency_relation: '',
        // Step 6: Vehicle
        has_vehicle: false,
        plate_number: '',
        vehicle_type: '',
        parking_requested: false,
        // Step 7: Photo
        photo_url: '',
        // Step 8: Documents
        id_type: '',
        id_number: '',
        expiry_date: '',
        asset_serial: '',
        // Step 9: Review confirmation
        confirmed_terms: true,
    });

    // ── WALK-IN HISTORY STATE ──
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');

    // Modals in History View
    const [inspectingWalkIn, setInspectingWalkIn] = useState(null);
    const [editingWalkIn, setEditingWalkIn] = useState(null);
    const [badgePrintWalkIn, setBadgePrintWalkIn] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Fetch initial dropdown data
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [empRes, deptRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/departments')
                ]);
                setHosts(Array.isArray(empRes.data) ? empRes.data : []);
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
            } catch (err) {
                console.error('Failed to load dropdown options:', err);
            }
        };
        fetchDropdowns();
    }, []);

    // Load Walk-in history whenever switching to 'history' tab or on mount
    const fetchWalkInHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get('/reception/walk-ins');
            setHistoryList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch walk-in history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchWalkInHistory();
    }, [activeTab]);

    // Handle field updates with automatic error clearing
    const handleFieldChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };

    // Helper to render concise error under each input field matching the user's design
    const renderFieldError = (field) => {
        if (!errors[field]) return null;
        return (
            <div className="flex items-center gap-1.5 mt-1.5 text-rose-400 text-xs font-semibold animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors[field]}</span>
            </div>
        );
    };

    // ── STEP-BY-STEP VALIDATION LOGIC ──
    const validateStep = (stepNumber) => {
        const newErrors = {};

        if (stepNumber === 1) {
            if (!form.first_name || form.first_name.trim().length < 2) {
                newErrors.first_name = isAm ? 'የመጀመሪያ ስም ያስፈልጋል.' : 'First Name is required.';
            }
            if (!form.last_name || form.last_name.trim().length < 2) {
                newErrors.last_name = isAm ? 'የአያት ስም ያስፈልጋል.' : 'Last Name is required.';
            }
            if (!form.gender) {
                newErrors.gender = isAm ? 'ጾታ ያስፈልጋል.' : 'Gender is required.';
            }
            if (!form.date_of_birth) {
                newErrors.date_of_birth = isAm ? 'የትውልድ ቀን ያስፈልጋል.' : 'Date of birth is required.';
            } else {
                const dobCheck = validateDateOfBirth(form.date_of_birth, 18);
                if (!dobCheck.valid) {
                    newErrors.date_of_birth = isAm ? 'ዕድሜ 18+ መሆን አለበት.' : 'Must be at least 18 years.';
                }
            }
            if (!form.nationality) {
                newErrors.nationality = isAm ? 'ዜግነት ያስፈልጋል.' : 'Nationality is required.';
            }
            if (!form.marital_status) {
                newErrors.marital_status = isAm ? 'የጋብቻ ሁኔታ ያስፈልጋል.' : 'Marital status is required.';
            }
        }

        if (stepNumber === 2) {
            if (!form.phone || !form.phone.trim()) {
                newErrors.phone = isAm ? 'ስልክ ቁጥር ያስፈልጋል.' : 'Phone number is required.';
            } else {
                const phoneCheck = validatePhoneNumber(form.phone, form.phonePrefix || '+251');
                if (!phoneCheck.valid) {
                    newErrors.phone = isAm ? 'ትክክለኛ ስልክ ቁጥር ያስገቡ.' : 'Valid phone number is required.';
                }
            }
            if (!form.email || !form.email.trim()) {
                newErrors.email = isAm ? 'ኢሜይል አድራሻ ያስፈልጋል.' : 'Email is required.';
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(form.email.trim())) {
                    newErrors.email = isAm ? 'ትክክለኛ ኢሜይል ያስገቡ.' : 'Valid email is required.';
                }
            }
            if (!form.company || form.company.trim().length < 2) {
                newErrors.company = isAm ? 'ድርጅት ያስፈልጋል.' : 'Company is required.';
            }
            if (!form.job_title || form.job_title.trim().length < 2) {
                newErrors.job_title = isAm ? 'የሥራ መደብ ያስፈልጋል.' : 'Job title is required.';
            }
        }

        if (stepNumber === 3) {
            if (!form.city || form.city.trim().length < 2) {
                newErrors.city = isAm ? 'ከተማ ያስፈልጋል.' : 'City is required.';
            }
            if (!form.subcity || form.subcity.trim().length < 2) {
                newErrors.subcity = isAm ? 'ክፍለ ከተማ ያስፈልጋል.' : 'Subcity is required.';
            }
            if (!form.woreda || form.woreda.trim().length < 1) {
                newErrors.woreda = isAm ? 'ወረዳ ያስፈልጋል.' : 'Woreda is required.';
            }
            if (!form.house_number || form.house_number.trim().length < 1) {
                newErrors.house_number = isAm ? 'የቤት ቁጥር ያስፈልጋል.' : 'House number is required.';
            }
        }

        if (stepNumber === 4) {
            if (!form.department_id) {
                newErrors.department_id = isAm ? 'ክፍል ያስፈልጋል.' : 'Department is required.';
            }
            if (!form.host_id) {
                newErrors.host_id = isAm ? 'ተቀባይ ሠራተኛ ያስፈልጋል.' : 'Host employee is required.';
            }
            if (!form.visitor_category) {
                newErrors.visitor_category = isAm ? 'የጎብኝ ምድብ ያስፈልጋል.' : 'Visitor category is required.';
            }
            if (!form.expected_duration) {
                newErrors.expected_duration = isAm ? 'የቆይታ ጊዜ ያስፈልጋል.' : 'Expected duration is required.';
            }
            if (!form.visit_purpose || form.visit_purpose.trim().length < 2) {
                newErrors.visit_purpose = isAm ? 'የጉብኝቱ ምክንያት ያስፈልጋል.' : 'Visit purpose is required.';
            }
        }

        if (stepNumber === 5) {
            if (!form.emergency_name || form.emergency_name.trim().length < 2) {
                newErrors.emergency_name = isAm ? 'የአደጋ ጊዜ ተጠሪ ስም ያስፈልጋል.' : 'Emergency contact name is required.';
            }
            if (!form.emergency_phone || form.emergency_phone.trim().length < 8) {
                newErrors.emergency_phone = isAm ? 'ስልክ ቁጥር ያስፈልጋል.' : 'Emergency phone is required.';
            }
            if (!form.emergency_relation) {
                newErrors.emergency_relation = isAm ? 'ዝምድና ያስፈልጋል.' : 'Relationship is required.';
            }
        }

        if (stepNumber === 6) {
            if (form.has_vehicle) {
                if (!form.plate_number || form.plate_number.trim().length < 2) {
                    newErrors.plate_number = isAm ? 'ታርጋ ቁጥር ያስፈልጋል.' : 'Plate number is required.';
                }
                if (!form.vehicle_type) {
                    newErrors.vehicle_type = isAm ? 'የተሽከርካሪ ዓይነት ያስፈልጋል.' : 'Vehicle type is required.';
                }
            }
        }

        if (stepNumber === 8) {
            if (!form.id_type) {
                newErrors.id_type = isAm ? 'የመታወቂያ ዓይነት ያስፈልጋል.' : 'ID type is required.';
            }
            if (!form.id_number || form.id_number.trim().length < 2) {
                newErrors.id_number = isAm ? 'የመታወቂያ ቁጥር ያስፈልጋል.' : 'ID number is required.';
            }
            if (form.expiry_date) {
                const today = new Date().toISOString().split('T')[0];
                if (form.expiry_date < today) {
                    newErrors.expiry_date = isAm ? 'መታወቂያው ጊዜው ያለፈበት ነው.' : 'ID Document has expired.';
                }
            }
        }

        if (stepNumber === 9) {
            if (!form.confirmed_terms) {
                newErrors.confirmed_terms = isAm ? 'ማረጋገጫ ያስፈልጋል.' : 'Confirmation is required.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Wizard Steps Configuration
    const steps = [
        { id: 1, key: 'personal', label: t('wizard.personal', 'PERSONAL'), icon: User, title: `${t('wizard.step', 'STEP')} 1: ${t('wizard.personal', 'PERSONAL INFORMATION')}`, subtitle: t('wizard.personalDesc', 'Enter primary visitor personal demographic details') },
        { id: 2, key: 'contact', label: t('wizard.contact', 'CONTACT'), icon: Mail, title: `${t('wizard.step', 'STEP')} 2: ${t('wizard.contact', 'CONTACT INFORMATION')}`, subtitle: t('wizard.contactDesc', 'Provide visitor phone, email, and organization details') },
        { id: 3, key: 'address', label: t('wizard.address', 'ADDRESS'), icon: MapPin, title: `${t('wizard.step', 'STEP')} 3: ${t('wizard.address', 'ADDRESS DETAILS')}`, subtitle: t('wizard.addressDesc', 'Enter residential address, subcity, and district') },
        { id: 4, key: 'visit', label: t('wizard.visit', 'VISIT'), icon: Briefcase, title: `${t('wizard.step', 'STEP')} 4: ${t('wizard.visit', 'VISIT & HOST DETAILS')}`, subtitle: t('wizard.visitDesc', 'Assign target department, host employee, and visit purpose') },
        { id: 5, key: 'emergency', label: t('wizard.emergency', 'EMERGENCY'), icon: Phone, title: `${t('wizard.step', 'STEP')} 5: ${t('wizard.emergency', 'EMERGENCY CONTACT')}`, subtitle: t('wizard.emergencyDesc', 'Specify emergency contact name and phone number') },
        { id: 6, key: 'vehicle', label: `${t('wizard.vehicle', 'VEHICLE')} (opt)`, icon: Car, title: `${t('wizard.step', 'STEP')} 6: ${t('wizard.vehicle', 'VEHICLE INFORMATION (OPTIONAL)')}`, subtitle: t('wizard.vehicleDesc', 'Register vehicle plate number and parking request') },
        { id: 7, key: 'photo', label: t('wizard.photo', 'PHOTO'), icon: Camera, title: `${t('wizard.step', 'STEP')} 7: ${t('wizard.photo', 'VISITOR PHOTO CAPTURE')}`, subtitle: t('wizard.photoDesc', 'Capture or upload visitor profile photograph') },
        { id: 8, key: 'documents', label: t('wizard.documents', 'DOCUMENTS'), icon: FileText, title: `${t('wizard.step', 'STEP')} 8: ${t('wizard.documents', 'IDENTITY DOCUMENTS')}`, subtitle: t('wizard.documentsDesc', 'Specify identity card type, identification number, and assets') },
        { id: 9, key: 'review', label: t('wizard.review', 'REVIEW'), icon: CheckSquare, title: `${t('wizard.step', 'STEP')} 9: ${t('wizard.review', 'REVIEW REGISTRATION')}`, subtitle: t('wizard.reviewDesc', 'Verify all registered visitor credentials before submission') },
        { id: 10, key: 'confirmation', label: t('wizard.confirmation', 'CONFIRMATION'), icon: CheckCircle, title: `${t('wizard.step', 'STEP')} 10: ${t('wizard.confirmation', 'REGISTRATION COMPLETE')}`, subtitle: t('wizard.confirmationDesc', 'Walk-in visitor pass issued successfully') },
    ];

    const handleNext = () => {
        setMessage(null);
        const isValid = validateStep(currentStep);
        if (!isValid) {
            // Do NOT display the large top banner. The red message appears cleanly under each invalid input.
            return;
        }

        if (currentStep < 9) {
            setCurrentStep(prev => prev + 1);
        } else if (currentStep === 9) {
            handleSubmitFinal();
        }
    };

    const handlePrev = () => {
        setMessage(null);
        setErrors({});
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmitFinal = async () => {
        if (!validateStep(9)) {
            return;
        }

        setLoading(true);
        setMessage(null);
        const fullName = `${form.first_name} ${form.middle_name ? form.middle_name + ' ' : ''}${form.last_name}`.trim();
        const payload = {
            ...form,
            full_name: fullName || 'Walk-In Guest',
            vehicle_plate: form.has_vehicle ? form.plate_number : '',
        };

        try {
            const res = await api.post('/reception/walk-ins', payload);
            setRegisteredResult(res.data);
            setMessage({ type: 'success', text: res.data.message || 'Walk-in visitor registered successfully!' });
            setCurrentStep(10);
            fetchWalkInHistory();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Registration failed. Please check form entries.' });
        } finally {
            setLoading(false);
        }
    };

    const resetAll = () => {
        setCurrentStep(1);
        setRegisteredResult(null);
        setMessage(null);
        setErrors({});
        setForm({
            first_name: '', middle_name: '', last_name: '', gender: '', date_of_birth: '',
            nationality: '', marital_status: '', phonePrefix: '+251', phone: '',
            email: '', company: '', job_title: '', subcity: '', woreda: '', house_number: '',
            city: '', department_id: '', host_id: '', visitor_category: '',
            visit_purpose: '', expected_duration: '',
            emergency_name: '', emergency_phone: '', emergency_relation: '',
            has_vehicle: false, plate_number: '', vehicle_type: '', parking_requested: false,
            photo_url: '', id_type: '', id_number: '', expiry_date: '',
            asset_serial: '', confirmed_terms: true,
        });
    };

    // ── WALK-IN HISTORY ACTIONS ──
    const handleDeleteWalkIn = async (appointmentId, visitorName) => {
        try {
            // Optimistic update
            setHistoryList(prev => prev.filter(item => item.appointment_id !== appointmentId));
            setMessage({ type: 'success', text: `Walk-in record for "${visitorName}" deleted successfully.` });
            await api.delete(`/reception/walk-ins/${appointmentId}`);
        } catch (err) {
            console.error('Delete error:', err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete walk-in record.' });
            fetchWalkInHistory();
        }
    };

    const handleSendTempPassword = async (appointmentId) => {
        setActionLoadingId(appointmentId);
        try {
            const res = await api.post(`/reception/walk-ins/${appointmentId}/send-temp-password`);
            setMessage({ 
                type: 'success', 
                text: res.data?.message || 'Temporary password generated and sent to visitor email.' 
            });
            fetchWalkInHistory();
        } catch (err) {
            console.error('Send temp password error:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.error || 'Failed to send temporary password.' 
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSendUserId = async (appointmentId) => {
        setActionLoadingId(appointmentId);
        try {
            const res = await api.post(`/reception/walk-ins/${appointmentId}/send-user-id`);
            setMessage({ 
                type: 'success', 
                text: res.data?.message || 'Visitor User ID and pass ticket dispatched to email.' 
            });
            fetchWalkInHistory();
        } catch (err) {
            console.error('Send User ID error:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.error || 'Failed to send User ID.' 
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingWalkIn) return;
        setActionLoadingId(editingWalkIn.appointment_id);
        try {
            await api.put(`/reception/walk-ins/${editingWalkIn.appointment_id}`, editingWalkIn);
            setMessage({ type: 'success', text: 'Walk-in registration details updated successfully.' });
            setEditingWalkIn(null);
            fetchWalkInHistory();
        } catch (err) {
            console.error('Save edit error:', err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update record.' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // Filtered History Records
    const filteredHistory = useMemo(() => {
        return historyList.filter(item => {
            const matchesSearch = !historySearch || 
                (item.full_name && item.full_name.toLowerCase().includes(historySearch.toLowerCase())) ||
                (item.visitor_code && item.visitor_code.toLowerCase().includes(historySearch.toLowerCase())) ||
                (item.appointment_number && item.appointment_number.toLowerCase().includes(historySearch.toLowerCase())) ||
                (item.phone && item.phone.includes(historySearch)) ||
                (item.email && item.email.toLowerCase().includes(historySearch.toLowerCase())) ||
                (item.company && item.company.toLowerCase().includes(historySearch.toLowerCase())) ||
                (item.host_name && item.host_name.toLowerCase().includes(historySearch.toLowerCase()));

            const matchesStatus = historyStatusFilter === 'ALL' || item.appointment_status === historyStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [historyList, historySearch, historyStatusFilter]);

    // KPI Summary Metrics
    const metrics = useMemo(() => {
        const total = historyList.length;
        const pending = historyList.filter(h => h.appointment_status === 'PENDING_APPROVAL').length;
        const approved = historyList.filter(h => h.appointment_status === 'APPROVED' || h.appointment_status === 'CHECKED_IN').length;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = historyList.filter(h => h.created_at && h.created_at.startsWith(todayStr)).length;
        return { total, pending, approved, todayCount };
    }, [historyList]);

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-[#070c16] min-h-screen text-slate-100 font-sans flex flex-col justify-between">
            <div>
                {/* ── TOP HEADER & VIEW MODE SELECTOR ── */}
                <div className="border-b border-slate-800/80 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <BackButton onClick={onNavigate ? () => onNavigate('dashboard') : undefined} fallbackUrl="/dashboard" />
                        <div>
                            <div className="flex items-center space-x-2.5">
                                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                    <User className="h-5 w-5 text-indigo-400" />
                                </div>
                                <h1 className="text-xl font-extrabold text-white tracking-tight uppercase">
                                    {isAm ? 'የቀጥታ ጎብኝዎች ምዝገባ እና ታሪክ' : 'Walk-In Visitor Registration & History'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* View Switcher Tabs */}
                    <div className="flex items-center gap-2 bg-[#0b1220] p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('register'); setMessage(null); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'register' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>{isAm ? 'አዲስ የቀጥታ ምዝገባ' : 'Register Walk-In'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('history'); setMessage(null); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isAm ? 'የቀጥታ ምዝገባ ታሪክ' : 'Walk-In History'}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                {historyList.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── NOTIFICATION / ALERT BANNER (Shown for API success / server notices, never for field validation) ── */}
                {message && (
                    <div className={`p-4 rounded-xl flex items-center justify-between border mb-6 shadow-xl animate-fadeIn ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                        <div className="flex items-center space-x-2.5 text-xs font-bold">
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
                            <span>{message.text}</span>
                        </div>
                        <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 p-1">✕</button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {/* ── TAB 1: 10-STEP WALK-IN REGISTRATION WIZARD ── */}
                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'register' && (
                    <div>
                        {/* 10-Step Wizard Capsule Bar */}
                        <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-3 shadow-xl mb-6 overflow-x-auto scrollbar-none">
                            <div className="flex items-center justify-between min-w-[850px] gap-2">
                                {steps.map((step) => {
                                    const StepIcon = step.icon;
                                    const isActive = currentStep === step.id;
                                    const isCompleted = currentStep > step.id;
                                    return (
                                        <button 
                                            key={step.id} 
                                            type="button" 
                                            onClick={() => {
                                                if (step.id < currentStep || currentStep === 10) {
                                                    setCurrentStep(step.id);
                                                }
                                            }} 
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[72px] ${isActive
                                                ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-500/10'
                                                : isCompleted
                                                    ? 'text-emerald-400 hover:bg-slate-800/60'
                                                    : 'text-slate-500 opacity-60'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400/30'
                                                : isCompleted
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                    : 'bg-slate-800 text-slate-400'}`}>
                                                {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <StepIcon className="w-4 h-4" />}
                                            </div>
                                            <span className="text-[10px] font-extrabold tracking-wider uppercase text-center truncate max-w-[80px]">
                                                {step.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Step Content Container */}
                        <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[420px] relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

                            {/* Active Step Title & Subtitle */}
                            <div className="border-b border-slate-800/80 pb-4 mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                                        {React.createElement(steps[currentStep - 1].icon, { className: 'h-4 w-4 text-indigo-400' })}
                                        <span>{steps[currentStep - 1].title}</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">
                                        {steps[currentStep - 1].subtitle}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold text-slate-400">
                                        {t('wizard.step', 'Step')} {currentStep} {t('wizard.of', 'of')} 10
                                    </span>
                                </div>
                            </div>

                            {/* ══════ STEP 1: PERSONAL INFORMATION ══════ */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">First Name *</label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="e.g. Abebe" 
                                                value={form.first_name} 
                                                onChange={(e) => handleFieldChange('first_name', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.first_name ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            />
                                            {renderFieldError('first_name')}
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Middle Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Kebede" 
                                                value={form.middle_name} 
                                                onChange={(e) => handleFieldChange('middle_name', e.target.value)} 
                                                className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Last Name *</label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="e.g. Tessema" 
                                                value={form.last_name} 
                                                onChange={(e) => handleFieldChange('last_name', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.last_name ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            />
                                            {renderFieldError('last_name')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Gender *</label>
                                            <select 
                                                value={form.gender} 
                                                onChange={(e) => handleFieldChange('gender', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.gender ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            >
                                                <option value="">{isAm ? 'ጾታ ይምረጡ...' : 'Select Gender...'}</option>
                                                <option value="Male">{isAm ? 'ወንድ' : 'Male'}</option>
                                                <option value="Female">{isAm ? 'ሴት' : 'Female'}</option>
                                                <option value="Other">{isAm ? 'ሌላ' : 'Other'}</option>
                                            </select>
                                            {renderFieldError('gender')}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-slate-300 text-xs font-bold uppercase">Date of Birth *</label>
                                                <span className="text-[10px] text-slate-400 font-semibold">Min. 18 yrs</span>
                                            </div>
                                            <input 
                                                type="date" 
                                                max={maxAllowedDob} 
                                                value={form.date_of_birth} 
                                                onChange={(e) => handleFieldChange('date_of_birth', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.date_of_birth ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            />
                                            {renderFieldError('date_of_birth')}
                                            {form.date_of_birth && !errors.date_of_birth && (() => {
                                                const res = validateDateOfBirth(form.date_of_birth, 18);
                                                return res.valid ? (
                                                    <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                                                        ✓ Age: {res.age} yrs (Eligible, ≥ 18)
                                                    </p>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div>
                                            <CountryNationalitySelect
                                                id="walkin-nationality"
                                                label="Nationality *"
                                                value={form.nationality}
                                                error={errors.nationality}
                                                onChange={(e) => handleFieldChange('nationality', e.target.value)}
                                                placeholder={isAm ? "ዜግነት ይምረጡ..." : "Select nationality..."}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Marital Status *</label>
                                            <select 
                                                value={form.marital_status} 
                                                onChange={(e) => handleFieldChange('marital_status', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.marital_status ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            >
                                                <option value="">{isAm ? 'የጋብቻ ሁኔታ ይምረጡ...' : 'Select Marital Status...'}</option>
                                                <option value="Single">{isAm ? 'ያላገባ' : 'Single'}</option>
                                                <option value="Married">{isAm ? 'ያገባ' : 'Married'}</option>
                                                <option value="Divorced">{isAm ? 'የፈታ' : 'Divorced'}</option>
                                                <option value="Widowed">{isAm ? 'የትዳር አጋሩ የሞተበት' : 'Widowed'}</option>
                                            </select>
                                            {renderFieldError('marital_status')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 2: CONTACT INFORMATION ══════ */}
                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
                                    <div>
                                        <CountryPhoneInput
                                            id="walkin-phone"
                                            label="Phone Number *"
                                            required
                                            value={form.phone}
                                            dialCode={form.phonePrefix || '+251'}
                                            onDialCodeChange={(dial) => handleFieldChange('phonePrefix', dial)}
                                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                                            placeholder="Phone number"
                                        />
                                        {renderFieldError('phone')}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Email Address *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <input 
                                                type="email" 
                                                placeholder="visitor@company.com" 
                                                value={form.email} 
                                                onChange={(e) => handleFieldChange('email', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.email ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            />
                                        </div>
                                        {renderFieldError('email')}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Organization / Company *</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Global Tech Solutions" 
                                                value={form.company} 
                                                onChange={(e) => handleFieldChange('company', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none ${errors.company ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            />
                                        </div>
                                        {renderFieldError('company')}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Job Title / Occupation *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Senior Auditor / Business Consultant" 
                                            value={form.job_title} 
                                            onChange={(e) => handleFieldChange('job_title', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.job_title ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('job_title')}
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 3: ADDRESS DETAILS ══════ */}
                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">City / Region *</label>
                                        <input 
                                            type="text" 
                                            placeholder="Addis Ababa" 
                                            value={form.city} 
                                            onChange={(e) => handleFieldChange('city', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.city ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('city')}
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Subcity / Zone *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Bole Subcity" 
                                            value={form.subcity} 
                                            onChange={(e) => handleFieldChange('subcity', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.subcity ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('subcity')}
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Woreda / District *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Woreda 03" 
                                            value={form.woreda} 
                                            onChange={(e) => handleFieldChange('woreda', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.woreda ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('woreda')}
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">House Number *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. H# 1024" 
                                            value={form.house_number} 
                                            onChange={(e) => handleFieldChange('house_number', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.house_number ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('house_number')}
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 4: VISIT & HOST DETAILS ══════ */}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Target Department *</label>
                                            <select 
                                                value={form.department_id} 
                                                onChange={(e) => handleFieldChange('department_id', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.department_id ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            >
                                                <option value="">Select Department...</option>
                                                {departments.map((dept) => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                            {renderFieldError('department_id')}
                                        </div>

                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Host Employee *</label>
                                            <select 
                                                required 
                                                value={form.host_id} 
                                                onChange={(e) => handleFieldChange('host_id', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-semibold ${errors.host_id ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            >
                                                <option value="">Select Host Employee...</option>
                                                {hosts.map((emp) => (
                                                    <option key={emp.id} value={emp.user_id || emp.id}>
                                                        {emp.full_name || emp.name} ({emp.job_title || emp.department_name || 'Staff'})
                                                    </option>
                                                ))}
                                            </select>
                                            {renderFieldError('host_id')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Visitor Pass Category *</label>
                                            <select 
                                                value={form.visitor_category} 
                                                onChange={(e) => handleFieldChange('visitor_category', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.visitor_category ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            >
                                                <option value="">{isAm ? 'የጎብኝ ምድብ ይምረጡ...' : 'Select Visitor Category...'}</option>
                                                <option value="Standard Visitor">Standard Visitor</option>
                                                <option value="VIP Guest">VIP Executive Guest</option>
                                                <option value="Contractor / Vendor">Contractor / Vendor</option>
                                                <option value="Temporary Employee">Temporary Employee</option>
                                            </select>
                                            {renderFieldError('visitor_category')}
                                        </div>

                                        <div>
                                            <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Expected Duration *</label>
                                            <select 
                                                value={form.expected_duration} 
                                                onChange={(e) => handleFieldChange('expected_duration', e.target.value)} 
                                                className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.expected_duration ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                            >
                                                <option value="">{isAm ? 'የቆይታ ጊዜ ይምረጡ...' : 'Select Expected Duration...'}</option>
                                                <option value="30 Mins">30 Minutes</option>
                                                <option value="1 Hour">1 Hour</option>
                                                <option value="2 Hours">2 Hours</option>
                                                <option value="Half Day">Half Day (4 Hours)</option>
                                                <option value="Full Day">Full Day</option>
                                            </select>
                                            {renderFieldError('expected_duration')}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Purpose of Visit *</label>
                                        <textarea 
                                            rows={2} 
                                            value={form.visit_purpose} 
                                            onChange={(e) => handleFieldChange('visit_purpose', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl p-3 text-xs text-white focus:outline-none ${errors.visit_purpose ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`} 
                                            placeholder="Describe visit purpose in detail..."
                                        />
                                        {renderFieldError('visit_purpose')}
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 5: EMERGENCY CONTACT ══════ */}
                            {currentStep === 5 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Contact Full Name *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Almaz Bekele" 
                                            value={form.emergency_name} 
                                            onChange={(e) => handleFieldChange('emergency_name', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.emergency_name ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('emergency_name')}
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Emergency Phone Number *</label>
                                        <input 
                                            type="text" 
                                            placeholder="+251 922 000 000" 
                                            value={form.emergency_phone} 
                                            onChange={(e) => handleFieldChange('emergency_phone', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.emergency_phone ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('emergency_phone')}
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Relationship *</label>
                                        <select 
                                            value={form.emergency_relation} 
                                            onChange={(e) => handleFieldChange('emergency_relation', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.emergency_relation ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        >
                                            <option value="">{isAm ? 'ዝምድና ይምረጡ...' : 'Select Relationship...'}</option>
                                            <option value="Relative">Relative</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Colleague">Colleague</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Friend">Friend</option>
                                        </select>
                                        {renderFieldError('emergency_relation')}
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 6: VEHICLE INFORMATION (OPTIONAL) ══════ */}
                            {currentStep === 6 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-[#070c16] p-4 rounded-xl border border-slate-700">
                                        <input 
                                            type="checkbox" 
                                            id="has_vehicle" 
                                            checked={form.has_vehicle} 
                                            onChange={(e) => handleFieldChange('has_vehicle', e.target.checked)} 
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-900"
                                        />
                                        <label htmlFor="has_vehicle" className="text-xs font-bold text-slate-200 cursor-pointer">
                                            Visitor is Arriving with a Vehicle / Automobile
                                        </label>
                                    </div>

                                    {form.has_vehicle && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                            <div>
                                                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Vehicle Plate Number *</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. AA 2-B12345" 
                                                    value={form.plate_number} 
                                                    onChange={(e) => handleFieldChange('plate_number', e.target.value)} 
                                                    className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono ${errors.plate_number ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                                />
                                                {renderFieldError('plate_number')}
                                            </div>
                                            <div>
                                                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Vehicle Type *</label>
                                                <select 
                                                    value={form.vehicle_type} 
                                                    onChange={(e) => handleFieldChange('vehicle_type', e.target.value)} 
                                                    className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${errors.vehicle_type ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                                >
                                                    <option value="">{isAm ? 'የተሽከርካሪ ዓይነት ይምረጡ...' : 'Select Vehicle Type...'}</option>
                                                    <option value="Sedan">Sedan Car</option>
                                                    <option value="SUV">SUV / 4WD</option>
                                                    <option value="Truck">Delivery Truck</option>
                                                    <option value="Motorcycle">Motorcycle</option>
                                                    <option value="Van">Minivan / Van</option>
                                                </select>
                                                {renderFieldError('vehicle_type')}
                                            </div>
                                            <div className="flex items-center pt-5">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={form.parking_requested} 
                                                        onChange={(e) => handleFieldChange('parking_requested', e.target.checked)} 
                                                        className="w-4 h-4 text-indigo-600 rounded"
                                                    />
                                                    Request Gate Parking Space
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════ STEP 7: VISITOR PHOTO CAPTURE ══════ */}
                            {currentStep === 7 && (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-[#070c16] space-y-4">
                                    <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center text-slate-400 overflow-hidden shadow-xl ring-4 ring-indigo-500/10">
                                        {form.photo_url ? (
                                            <img src={resolvePhotoUrl(form.photo_url)} alt="Visitor" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-12 h-12 text-indigo-400/80" />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xs font-bold text-slate-200 block">Capture WebCam Snapshot or Upload Profile Photo</span>
                                        <p className="text-[11px] text-slate-400">Photo will be printed onto the physical visitor pass and digital badge</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <button 
                                            type="button" 
                                            onClick={() => handleFieldChange('photo_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300')} 
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                                        >
                                            <Camera className="w-3.5 h-3.5" /> Fast Snapshot (Demo)
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => handleFieldChange('photo_url', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300')} 
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5"
                                        >
                                            <Upload className="w-3.5 h-3.5" /> Sample Photo 2
                                        </button>
                                        {form.photo_url && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleFieldChange('photo_url', '')} 
                                                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase"
                                            >
                                                Clear Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 8: IDENTITY DOCUMENTS ══════ */}
                            {currentStep === 8 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Identity Document Type *</label>
                                        <select 
                                            value={form.id_type} 
                                            onChange={(e) => handleFieldChange('id_type', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-semibold ${errors.id_type ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        >
                                            <option value="">{isAm ? 'የመታወቂያ ዓይነት ይምረጡ...' : 'Select Identity Document Type...'}</option>
                                            <option value="National ID Card">National ID Card (ፋይዳ / Kebele)</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Driver License">Driver's License</option>
                                            <option value="Employee Badge">External Corporate Badge</option>
                                            <option value="Student ID">Student ID</option>
                                        </select>
                                        {renderFieldError('id_type')}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">ID Identification Number *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. ET-ID-8849201" 
                                            value={form.id_number} 
                                            onChange={(e) => handleFieldChange('id_number', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono ${errors.id_number ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('id_number')}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Asset / Laptop Serial # (Optional)</label>
                                        <div className="relative">
                                            <Laptop className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Dell XPS Serial #ABC-123" 
                                                value={form.asset_serial} 
                                                onChange={(e) => handleFieldChange('asset_serial', e.target.value)} 
                                                className="w-full bg-[#070c16] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold uppercase mb-1">ID Document Expiry Date</label>
                                        <input 
                                            type="date" 
                                            value={form.expiry_date} 
                                            onChange={(e) => handleFieldChange('expiry_date', e.target.value)} 
                                            className={`w-full bg-[#070c16] border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${errors.expiry_date ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5' : 'border-slate-700 focus:border-indigo-500'}`}
                                        />
                                        {renderFieldError('expiry_date')}
                                    </div>
                                </div>
                            )}

                            {/* ══════ STEP 9: REVIEW REGISTRATION ══════ */}
                            {currentStep === 9 && (
                                <div className="space-y-4">
                                    <div className="bg-[#070c16] border border-slate-800 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Visitor Name:</span>
                                            <strong className="text-white font-bold">{form.first_name} {form.middle_name} {form.last_name}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Phone:</span>
                                            <strong className="text-white font-mono">{form.phone || 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Email:</span>
                                            <strong className="text-white font-mono">{form.email || 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Organization:</span>
                                            <strong className="text-white font-bold">{form.company || 'Private Guest'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Identity Document:</span>
                                            <strong className="text-indigo-400 font-bold">{form.id_type} ({form.id_number || 'N/A'})</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Host Employee:</span>
                                            <strong className="text-amber-400 font-bold">{form.host_id ? `Host ID #${form.host_id}` : 'Selected'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Address:</span>
                                            <strong className="text-slate-300 font-bold">{form.city}, {form.subcity}, Woreda {form.woreda}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Vehicle:</span>
                                            <strong className="text-slate-300 font-bold">{form.has_vehicle ? `${form.vehicle_type} (${form.plate_number})` : 'No Vehicle'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Visit Purpose:</span>
                                            <strong className="text-white font-bold">{form.visit_purpose}</strong>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${errors.confirmed_terms ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-indigo-950/20 border-indigo-500/30'}`}>
                                        <input 
                                            type="checkbox" 
                                            id="confirm_terms" 
                                            checked={form.confirmed_terms} 
                                            onChange={(e) => handleFieldChange('confirmed_terms', e.target.checked)} 
                                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                                        />
                                        <label htmlFor="confirm_terms" className="text-xs font-bold text-indigo-200 cursor-pointer">
                                            I confirm all provided walk-in visitor details are accurate, ID is verified, and terms are accepted at the reception gate.
                                        </label>
                                    </div>
                                    {renderFieldError('confirmed_terms')}
                                </div>
                            )}

                            {/* ══════ STEP 10: CONFIRMATION ══════ */}
                            {currentStep === 10 && registeredResult && (
                                <div className="bg-[#070c16] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4 max-w-xl mx-auto">
                                    <div className="w-14 h-14 bg-emerald-500/20 rounded-full border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                                        <BadgeCheck className="w-8 h-8" />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Walk-In Visitor Ticket Registered!</h3>
                                        <p className="text-xs text-slate-400 mt-1">Host approval request has been triggered automatically.</p>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-2 gap-4 text-xs text-left">
                                        <div>
                                            <span className="text-slate-500 block">Pass Reference Code:</span>
                                            <strong className="text-indigo-400 font-mono font-bold text-sm">{registeredResult.appointment_number || 'WALK-2026-8891'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Assigned Queue #:</span>
                                            <strong className="text-emerald-400 font-mono font-bold text-lg">{registeredResult.queue_number || 'Q-W104'}</strong>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-center gap-3">
                                        <button 
                                            onClick={() => window.print()} 
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5"
                                        >
                                            <Printer className="w-4 h-4 text-indigo-400" />
                                            Print Visitor Badge
                                        </button>
                                        <button 
                                            onClick={resetAll} 
                                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase"
                                        >
                                            Register Another Walk-In
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Navigation Control Bar */}
                        <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between mt-6">
                            <button 
                                type="button" 
                                disabled={currentStep === 1 || currentStep === 10} 
                                onClick={handlePrev} 
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all ${currentStep === 1 || currentStep === 10
                                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>{t('form.previousStep', 'Previous Step')}</span>
                            </button>

                            {currentStep < 9 && (
                                <button 
                                    type="button" 
                                    onClick={handleNext} 
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                                >
                                    <span>{t('form.nextStep', 'Next Step')}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}

                            {currentStep === 9 && (
                                <button 
                                    type="button" 
                                    disabled={loading} 
                                    onClick={handleSubmitFinal} 
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>{loading ? t('wizard.submitting', 'Registering...') : t('form.submitRegistration', 'Register & Submit >')}</span>
                                </button>
                            )}

                            {currentStep === 10 && (
                                <button 
                                    type="button" 
                                    onClick={resetAll} 
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                                >
                                    <span>{t('form.create', 'Start New Registration')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {/* ── TAB 2: WALK-IN HISTORY & ACTIONS TABLE ── */}
                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Walk-Ins</span>
                                    <div className="text-2xl font-black text-white mt-1">{metrics.total}</div>
                                </div>
                                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                                    <User className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending Approval</span>
                                    <div className="text-2xl font-black text-amber-400 mt-1">{metrics.pending}</div>
                                </div>
                                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Approved & Ready</span>
                                    <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.approved}</div>
                                </div>
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                    <BadgeCheck className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Today's Registered</span>
                                    <div className="text-2xl font-black text-purple-400 mt-1">{metrics.todayCount}</div>
                                </div>
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Search, Filter & Refresh Bar */}
                        <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex-1 w-full md:w-auto relative">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={historySearch} 
                                    onChange={(e) => setHistorySearch(e.target.value)} 
                                    placeholder={isAm ? 'በስም፣ በስልክ፣ በኢሜይል፣ በመታወቂያ ወይም በቲኬት ፈልግ...' : 'Search by name, User ID, phone, email, appointment #, or host...'} 
                                    className="w-full bg-[#070c16] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2.5 w-full md:w-auto">
                                <div className="flex items-center gap-2 bg-[#070c16] border border-slate-700/80 rounded-xl px-3 py-2">
                                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                                    <select 
                                        value={historyStatusFilter} 
                                        onChange={(e) => setHistoryStatusFilter(e.target.value)} 
                                        className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
                                    >
                                        <option value="ALL" className="bg-[#0b1220]">All Statuses</option>
                                        <option value="PENDING_APPROVAL" className="bg-[#0b1220]">Pending Approval</option>
                                        <option value="APPROVED" className="bg-[#0b1220]">Approved</option>
                                        <option value="CHECKED_IN" className="bg-[#0b1220]">Checked In</option>
                                        <option value="COMPLETED" className="bg-[#0b1220]">Completed</option>
                                        <option value="CANCELLED" className="bg-[#0b1220]">Cancelled</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={fetchWalkInHistory} 
                                    disabled={loadingHistory}
                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700" 
                                    title="Refresh Registry"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin text-indigo-400' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Walk-In History Records Table */}
                        <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-[#070c16]/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                            <th className="py-3.5 px-4">Visitor Profile & ID</th>
                                            <th className="py-3.5 px-4">Organization & Document</th>
                                            <th className="py-3.5 px-4">Host & Department</th>
                                            <th className="py-3.5 px-4">Pass & Queue</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4">Registration Time</th>
                                            <th className="py-3.5 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-xs">
                                        {filteredHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-slate-500">
                                                    <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    <p className="font-bold">No walk-in records match the current filter.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistory.map((item) => {
                                                const initials = (item.full_name || 'Walk-In')
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase();

                                                const isActionRunning = actionLoadingId === item.appointment_id;

                                                return (
                                                    <tr key={item.appointment_id} className="hover:bg-slate-800/30 transition-colors">
                                                        {/* Visitor Profile Icon & User ID */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative shrink-0">
                                                                    {item.photo_url ? (
                                                                        <img 
                                                                            src={resolvePhotoUrl(item.photo_url)} 
                                                                            alt={item.full_name} 
                                                                            className="w-10 h-10 rounded-full object-cover border border-indigo-500/40 shadow"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow">
                                                                            {initials}
                                                                        </div>
                                                                    )}
                                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0b1220] rounded-full" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-extrabold text-white">{item.full_name || 'Walk-In Visitor'}</div>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                                                                            {item.visitor_code || `VIS-${item.visitor_id}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                                        <span>{item.phone}</span>
                                                                        {item.email && <span className="truncate max-w-[140px] text-slate-500">• {item.email}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Organization & ID */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-slate-200">{item.company || 'Independent Visitor'}</div>
                                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                                {item.id_type || 'ID'}: <span className="font-mono text-slate-300">{item.id_number || 'N/A'}</span>
                                                            </div>
                                                            {item.visitor_category && (
                                                                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                                    {item.visitor_category}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Host & Department */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-slate-200">{item.host_name || 'Staff Employee'}</div>
                                                            <div className="text-[11px] text-indigo-400 mt-0.5 font-medium">
                                                                {item.department_name || 'General Desk'}
                                                            </div>
                                                        </td>

                                                        {/* Pass & Queue */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-mono text-xs font-bold text-slate-200">
                                                                {item.appointment_number}
                                                            </div>
                                                            {item.queue_number && (
                                                                <div className="mt-1">
                                                                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                                                                        {item.queue_number}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                                item.appointment_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                                item.appointment_status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                                item.appointment_status === 'CHECKED_IN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                                'bg-slate-800 text-slate-400 border-slate-700'
                                                            }`}>
                                                                {item.appointment_status || 'PENDING'}
                                                            </span>
                                                        </td>

                                                        {/* Registration Time */}
                                                        <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                                                            <div>{new Date(item.created_at || item.scheduled_start).toLocaleDateString()}</div>
                                                            <div className="text-slate-500 text-[10px]">
                                                                {new Date(item.created_at || item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {/* View */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setInspectingWalkIn(item)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Edit */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingWalkIn({ ...item })}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
                                                                    title="Edit Details"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Send Temporary Password */}
                                                                <button
                                                                    type="button"
                                                                    disabled={isActionRunning}
                                                                    onClick={() => handleSendTempPassword(item.appointment_id)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                                                                    title="Email Temporary Password"
                                                                >
                                                                    <Key className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Send User ID using Email */}
                                                                <button
                                                                    type="button"
                                                                    disabled={isActionRunning}
                                                                    onClick={() => handleSendUserId(item.appointment_id)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                                                    title="Email User ID & Pass Reference"
                                                                >
                                                                    <UserCheck className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Print Pass */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBadgePrintWalkIn(item)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg transition-colors cursor-pointer"
                                                                    title="Print Badge"
                                                                >
                                                                    <Printer className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Delete */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteWalkIn(item.appointment_id, item.full_name)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                                                    title="Delete Walk-In"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL 1: VIEW DETAILS INSPECTOR ── */}
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {inspectingWalkIn && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
                        <button 
                            type="button" 
                            onClick={() => setInspectingWalkIn(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-5">
                            {inspectingWalkIn.photo_url ? (
                                <img 
                                    src={resolvePhotoUrl(inspectingWalkIn.photo_url)} 
                                    alt={inspectingWalkIn.full_name} 
                                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-xl">
                                    {(inspectingWalkIn.full_name || 'W').charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-black text-white">{inspectingWalkIn.full_name}</h3>
                                <p className="text-xs text-indigo-400 font-mono font-bold mt-0.5">
                                    User ID: {inspectingWalkIn.visitor_code || `VIS-${inspectingWalkIn.visitor_id}`}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Appointment: <span className="font-mono text-slate-300">{inspectingWalkIn.appointment_number}</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-6">
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Phone:</span>
                                <strong className="text-white font-mono">{inspectingWalkIn.phone || 'N/A'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Email:</span>
                                <strong className="text-white font-mono truncate block">{inspectingWalkIn.email || 'N/A'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Organization:</span>
                                <strong className="text-white">{inspectingWalkIn.company || 'Private Guest'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Host Employee:</span>
                                <strong className="text-amber-400">{inspectingWalkIn.host_name || 'Staff'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Department:</span>
                                <strong className="text-indigo-400">{inspectingWalkIn.department_name || 'General Desk'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Pass Status:</span>
                                <strong className="text-emerald-400 font-bold">{inspectingWalkIn.appointment_status || 'PENDING'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Identity Document:</span>
                                <strong className="text-white">{inspectingWalkIn.id_type || 'National ID'}: {inspectingWalkIn.id_number || 'N/A'}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Address:</span>
                                <strong className="text-white">{inspectingWalkIn.city || 'Addis Ababa'}, {inspectingWalkIn.subcity || ''}</strong>
                            </div>
                            <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block">Vehicle:</span>
                                <strong className="text-white">{inspectingWalkIn.vehicle_plate_number || 'No Vehicle'}</strong>
                            </div>
                        </div>

                        <div className="bg-[#070c16] p-3 rounded-xl border border-slate-800 mb-6 text-xs">
                            <span className="text-slate-500 block">Purpose of Visit:</span>
                            <p className="text-slate-200 mt-1">{inspectingWalkIn.purpose || 'Walk-in Consultation'}</p>
                        </div>

                        <div className="flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    const item = inspectingWalkIn;
                                    setInspectingWalkIn(null);
                                    setBadgePrintWalkIn(item);
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print Badge</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectingWalkIn(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL 2: EDIT WALK-IN RECORD ── */}
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {editingWalkIn && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
                        <button 
                            type="button" 
                            onClick={() => setEditingWalkIn(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="border-b border-slate-800 pb-3 mb-4">
                            <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-amber-400" />
                                Edit Walk-In Visitor Details
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Modify demographic or host information for Pass #{editingWalkIn.appointment_number}
                            </p>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1">Full Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editingWalkIn.full_name || ''} 
                                        onChange={(e) => setEditingWalkIn({ ...editingWalkIn, full_name: e.target.value })} 
                                        className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1">Phone Number *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editingWalkIn.phone || ''} 
                                        onChange={(e) => setEditingWalkIn({ ...editingWalkIn, phone: e.target.value })} 
                                        className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={editingWalkIn.email || ''} 
                                        onChange={(e) => setEditingWalkIn({ ...editingWalkIn, email: e.target.value })} 
                                        className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1">Company / Organization</label>
                                    <input 
                                        type="text" 
                                        value={editingWalkIn.company || ''} 
                                        onChange={(e) => setEditingWalkIn({ ...editingWalkIn, company: e.target.value })} 
                                        className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1">Host Employee</label>
                                    <select 
                                        value={editingWalkIn.host_id || ''} 
                                        onChange={(e) => setEditingWalkIn({ ...editingWalkIn, host_id: e.target.value })} 
                                        className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Select Host...</option>
                                        {hosts.map(h => (
                                            <option key={h.id} value={h.user_id || h.id}>{h.full_name || h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1">Pass Status</label>
                                    <select 
                                        value={editingWalkIn.appointment_status || 'PENDING_APPROVAL'} 
                                        onChange={(e) => setEditingWalkIn({ ...editingWalkIn, appointment_status: e.target.value, status: e.target.value })} 
                                        className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                    >
                                        <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                                        <option value="APPROVED">APPROVED</option>
                                        <option value="CHECKED_IN">CHECKED_IN</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold uppercase mb-1">Purpose of Visit</label>
                                <textarea 
                                    rows={2} 
                                    value={editingWalkIn.purpose || ''} 
                                    onChange={(e) => setEditingWalkIn({ ...editingWalkIn, purpose: e.target.value })} 
                                    className="w-full bg-[#070c16] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingWalkIn(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={actionLoadingId === editingWalkIn.appointment_id}
                                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-600/30"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{actionLoadingId === editingWalkIn.appointment_id ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL 3: BADGE PRINT MODAL ── */}
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {badgePrintWalkIn && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <button 
                            type="button" 
                            onClick={() => setBadgePrintWalkIn(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-4">
                            <h3 className="text-base font-black text-white uppercase">Walk-In Visitor Badge Preview</h3>
                            <p className="text-xs text-slate-400">Ready to dispatch and print at reception gate</p>
                        </div>

                        {/* Physical Badge Card Design */}
                        <div className="bg-gradient-to-b from-slate-900 via-[#070c16] to-[#040810] border-2 border-indigo-500/60 rounded-2xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

                            {/* Company Branding */}
                            <div className="flex items-center justify-center gap-2 pt-1">
                                {companyLogo && (
                                    <img src={companyLogo} alt={companyName} className="h-6 w-auto object-contain" />
                                )}
                                <span className="text-xs font-black text-white uppercase tracking-wider">{companyName}</span>
                            </div>

                            {/* Badge Type Banner */}
                            <div className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                                WALK-IN VISITOR PASS
                            </div>

                            {/* Visitor Photo & User ID */}
                            <div className="flex flex-col items-center">
                                {badgePrintWalkIn.photo_url ? (
                                    <img 
                                        src={resolvePhotoUrl(badgePrintWalkIn.photo_url)} 
                                        alt={badgePrintWalkIn.full_name} 
                                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-400 shadow-xl"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                                        {(badgePrintWalkIn.full_name || 'W').charAt(0)}
                                    </div>
                                )}
                                <h4 className="text-base font-black text-white mt-2">{badgePrintWalkIn.full_name}</h4>
                                <span className="text-xs text-indigo-400 font-mono font-bold">
                                    ID: {badgePrintWalkIn.visitor_code || `VIS-${badgePrintWalkIn.visitor_id}`}
                                </span>
                                <span className="text-[11px] text-slate-400">{badgePrintWalkIn.company || 'Private Guest'}</span>
                            </div>

                            {/* Pass Meta */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-left text-[11px]">
                                <div>
                                    <span className="text-slate-500 block">Host:</span>
                                    <strong className="text-white truncate block">{badgePrintWalkIn.host_name || 'Reception Staff'}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Department:</span>
                                    <strong className="text-indigo-400 truncate block">{badgePrintWalkIn.department_name || 'General Desk'}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Appointment Ref:</span>
                                    <strong className="text-slate-300 font-mono text-[10px] block">{badgePrintWalkIn.appointment_number}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Queue Ticket:</span>
                                    <strong className="text-emerald-400 font-mono font-bold block">{badgePrintWalkIn.queue_number || 'General'}</strong>
                                </div>
                            </div>

                            {/* QR Token Preview */}
                            <div className="p-3 bg-white rounded-xl inline-block shadow-inner mx-auto">
                                <QrCode className="w-20 h-20 text-slate-900" />
                            </div>
                        </div>

                        <div className="flex justify-center gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print Badge Now</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBadgePrintWalkIn(null)}
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
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
