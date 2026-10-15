import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Briefcase, Phone, Car, Camera, FileText, CheckSquare, CheckCircle, CheckCircle2, AlertCircle, Printer, ChevronLeft, ChevronRight, Send, Building, Upload, BadgeCheck, Laptop } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import CountryNationalitySelect from '../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../components/common/CountryPhoneInput';
import { validateDateOfBirth, validatePhoneNumber } from '../../data/countriesData';

const maxAllowedDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();
export default function WalkInVisitorManagement({ onNavigate }) {
    const { t, tStatus } = useLanguage();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [hosts, setHosts] = useState([]);
    const [departments, setDepartments] = useState([]);
    // 10-Step Wizard State
    const [form, setForm] = useState({
        // Step 1: Personal
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'Male',
        date_of_birth: '',
        nationality: 'Ethiopian',
        marital_status: 'Single',
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
        city: 'Addis Ababa',
        // Step 4: Visit & Host
        department_id: '',
        host_id: '',
        visitor_category: 'Standard Visitor',
        visit_purpose: 'Unscheduled Business Walk-in',
        expected_duration: '1 Hour',
        // Step 5: Emergency
        emergency_name: '',
        emergency_phone: '',
        emergency_relation: 'Relative',
        // Step 6: Vehicle
        has_vehicle: false,
        plate_number: '',
        vehicle_type: 'Sedan',
        parking_requested: false,
        // Step 7: Photo
        photo_url: '',
        // Step 8: Documents
        id_type: 'National ID Card',
        id_number: '',
        expiry_date: '',
        asset_serial: '',
        // Step 9: Review confirmation
        confirmed_terms: true,
    });
    const [registeredResult, setRegisteredResult] = useState(null);
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [empRes, deptRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/departments')
                ]);
                setHosts(Array.isArray(empRes.data) ? empRes.data : []);
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
            }
            catch (err) {
                console.error('Failed to load dropdown options:', err);
            }
        };
        fetchDropdowns();
    }, []);
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
        if (currentStep === 1) {
            if (!form.first_name || !form.last_name) {
                setMessage({ type: 'error', text: 'Please enter First Name and Last Name to continue.' });
                return;
            }
            if (form.date_of_birth) {
                const dobCheck = validateDateOfBirth(form.date_of_birth, 18);
                if (!dobCheck.valid) {
                    setMessage({ type: 'error', text: dobCheck.error });
                    return;
                }
            }
        }
        if (currentStep === 2) {
            if (!form.phone || !form.phone.trim()) {
                setMessage({ type: 'error', text: 'Please enter a valid Phone Number to continue.' });
                return;
            }
            const phoneCheck = validatePhoneNumber(form.phone, form.phonePrefix || '+251');
            if (!phoneCheck.valid) {
                setMessage({ type: 'error', text: phoneCheck.error });
                return;
            }
        }
        if (currentStep === 4 && !form.host_id) {
            setMessage({ type: 'error', text: 'Please select a Host Employee to continue.' });
            return;
        }
        if (currentStep < 9) {
            setCurrentStep(prev => prev + 1);
        }
        else if (currentStep === 9) {
            handleSubmitFinal();
        }
    };
    const handlePrev = () => {
        setMessage(null);
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };
    const handleSubmitFinal = async () => {
        setLoading(true);
        setMessage(null);
        const fullName = `${form.first_name} ${form.middle_name ? form.middle_name + ' ' : ''}${form.last_name}`.trim();
        const payload = {
            full_name: fullName || 'Walk-In Guest',
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            company: form.company,
            id_type: form.id_type,
            id_number: form.id_number,
            host_id: form.host_id,
            department_id: form.department_id,
            visitor_category: form.visitor_category,
            asset_serial: form.asset_serial,
            visit_purpose: form.visit_purpose,
            photo_url: form.photo_url,
            vehicle_plate: form.has_vehicle ? form.plate_number : '',
        };
        try {
            const res = await api.post('/reception/walk-ins', payload);
            setRegisteredResult(res.data);
            setMessage({ type: 'success', text: res.data.message || 'Walk-in visitor registered successfully!' });
            setCurrentStep(10);
        }
        catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Registration failed. Please check form entries.' });
        }
        finally {
            setLoading(false);
        }
    };
    const resetAll = () => {
        setCurrentStep(1);
        setRegisteredResult(null);
        setMessage(null);
        setForm({
            first_name: '', middle_name: '', last_name: '', gender: 'Male', date_of_birth: '',
            nationality: 'Ethiopian', marital_status: 'Single', phone: '', email: '', company: '',
            job_title: '', subcity: '', woreda: '', house_number: '', city: 'Addis Ababa',
            department_id: '', host_id: '', visitor_category: 'Standard Visitor',
            visit_purpose: 'Unscheduled Business Walk-in', expected_duration: '1 Hour',
            emergency_name: '', emergency_phone: '', emergency_relation: 'Relative',
            has_vehicle: false, plate_number: '', vehicle_type: 'Sedan', parking_requested: false,
            photo_url: '', id_type: 'National ID Card', id_number: '', expiry_date: '',
            asset_serial: '', confirmed_terms: true,
        });
    };
    return (<div className="p-4 sm:p-6 space-y-6 bg-[#070c16] min-h-screen text-slate-100 font-sans flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="border-b border-slate-800/80 pb-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton onClick={onNavigate ? () => onNavigate('dashboard') : undefined} fallbackUrl="/dashboard"/>
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                  <User className="h-5 w-5 text-indigo-400"/>
                </div>
                <h1 className="text-xl font-extrabold text-white tracking-tight uppercase">
                  {t('receptionDash.walkInRegistration', 'Walk-In Visitor Registration Form')}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {t('receptionDash.subtitle', 'Multi-step registration workflow for unscheduled visitors at reception gate.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              {t('wizard.step', 'Step')} {currentStep} {t('wizard.of', 'of')} 10
            </span>
            <button onClick={resetAll} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase transition-colors">
              {t('form.reset', 'Reset Form')}
            </button>
          </div>
        </div>

        {/* 10-Step Wizard Navigation Capsule Bar */}
        <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-3 shadow-xl mb-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[850px] gap-2">
            {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (<button key={step.id} type="button" onClick={() => {
                    if (step.id < currentStep || currentStep === 10) {
                        setCurrentStep(step.id);
                    }
                }} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[72px] ${isActive
                    ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-500/10'
                    : isCompleted
                        ? 'text-emerald-400 hover:bg-slate-800/60'
                        : 'text-slate-500 opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400/30'
                    : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'}`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <StepIcon className="w-4 h-4"/>}
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-center truncate max-w-[80px]">
                    {step.label}
                  </span>
                </button>);
        })}
          </div>
        </div>

        {/* Error / Alert Banner */}
        {message && (<div className={`p-4 rounded-xl flex items-center justify-between border mb-6 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            <div className="flex items-center space-x-2 text-xs font-bold">
              {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0"/> : <AlertCircle className="h-4 w-4 text-red-400 shrink-0"/>}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
          </div>)}

        {/* Active Step Content Container */}
        <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[420px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"/>

          {/* Active Step Title & Subtitle */}
          <div className="border-b border-slate-800/80 pb-4 mb-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: 'h-4 w-4 text-indigo-400' })}
              <span>{steps[currentStep - 1].title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {steps[currentStep - 1].subtitle}
            </p>
          </div>

          {/* ══════ STEP 1: PERSONAL INFORMATION ══════ */}
          {currentStep === 1 && (<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">First Name *</label>
                  <input type="text" required placeholder="e.g. Abebe" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Middle Name</label>
                  <input type="text" placeholder="e.g. Kebede" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Last Name *</label>
                  <input type="text" required placeholder="e.g. Tessema" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Gender *</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 text-xs font-bold uppercase">Date of Birth *</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Min. 18 yrs</span>
                  </div>
                  <input type="date" max={maxAllowedDob} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                  {form.date_of_birth && (() => {
                    const res = validateDateOfBirth(form.date_of_birth, 18);
                    return res.valid ? (
                      <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                        ✓ Age: {res.age} yrs (Eligible, ≥ 18)
                      </p>
                    ) : (
                      <p className="text-[10px] text-rose-400 mt-1 font-semibold">
                        ⚠️ Under 18 years: {res.error}
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <CountryNationalitySelect
                    id="walkin-nationality"
                    label="Nationality"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    placeholder="Select nationality..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Marital Status</label>
                  <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>)}

          {/* ══════ STEP 2: CONTACT INFORMATION ══════ */}
          {currentStep === 2 && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
              <div>
                <CountryPhoneInput
                  id="walkin-phone"
                  label="Phone Number"
                  required
                  value={form.phone}
                  dialCode={form.phonePrefix || '+251'}
                  onDialCodeChange={(dial) => setForm({ ...form, phonePrefix: dial })}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
                  <input type="email" placeholder="visitor@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Organization / Company</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
                  <input type="text" placeholder="e.g. Global Tech Solutions" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Job Title / Occupation</label>
                <input type="text" placeholder="e.g. Senior Auditor" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
            </div>)}

          {/* ══════ STEP 3: ADDRESS DETAILS ══════ */}
          {currentStep === 3 && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">City / Region</label>
                <input type="text" placeholder="Addis Ababa" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Subcity / Zone</label>
                <input type="text" placeholder="e.g. Bole Subcity" value={form.subcity} onChange={(e) => setForm({ ...form, subcity: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Woreda / District</label>
                <input type="text" placeholder="e.g. Woreda 03" value={form.woreda} onChange={(e) => setForm({ ...form, woreda: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">House Number</label>
                <input type="text" placeholder="e.g. H# 1024" value={form.house_number} onChange={(e) => setForm({ ...form, house_number: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
            </div>)}

          {/* ══════ STEP 4: VISIT & HOST DETAILS ══════ */}
          {currentStep === 4 && (<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Target Department</label>
                  <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Host Employee *</label>
                  <select required value={form.host_id} onChange={(e) => setForm({ ...form, host_id: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold">
                    <option value="">Select Host Employee...</option>
                    {hosts.map((emp) => (<option key={emp.id} value={emp.user_id || emp.id}>
                        {emp.full_name || emp.name} ({emp.job_title || emp.department_name || 'Staff'})
                      </option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Visitor Pass Category</label>
                  <select value={form.visitor_category} onChange={(e) => setForm({ ...form, visitor_category: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="Standard Visitor">Standard Visitor</option>
                    <option value="VIP Guest">VIP Executive Guest</option>
                    <option value="Contractor / Vendor">Contractor / Vendor</option>
                    <option value="Temporary Employee">Temporary Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Expected Duration</label>
                  <select value={form.expected_duration} onChange={(e) => setForm({ ...form, expected_duration: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="30 Mins">30 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="Half Day">Half Day (4 Hours)</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Purpose of Visit</label>
                <textarea rows={2} value={form.visit_purpose} onChange={(e) => setForm({ ...form, visit_purpose: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="Describe visit purpose..."/>
              </div>
            </div>)}

          {/* ══════ STEP 5: EMERGENCY CONTACT ══════ */}
          {currentStep === 5 && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Contact Full Name</label>
                <input type="text" placeholder="e.g. Almaz Bekele" value={form.emergency_name} onChange={(e) => setForm({ ...form, emergency_name: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Emergency Phone Number</label>
                <input type="text" placeholder="+251 922 000 000" value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Relationship</label>
                <select value={form.emergency_relation} onChange={(e) => setForm({ ...form, emergency_relation: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="Relative">Relative</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>
            </div>)}

          {/* ══════ STEP 6: VEHICLE INFORMATION (OPTIONAL) ══════ */}
          {currentStep === 6 && (<div className="space-y-4">
              <div className="flex items-center gap-3 bg-[#070c16] p-4 rounded-xl border border-slate-700">
                <input type="checkbox" id="has_vehicle" checked={form.has_vehicle} onChange={(e) => setForm({ ...form, has_vehicle: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-900"/>
                <label htmlFor="has_vehicle" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Visitor is Arriving with a Vehicle / Automobile
                </label>
              </div>

              {form.has_vehicle && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Vehicle Plate Number</label>
                    <input type="text" placeholder="e.g. AA 2-B12345" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"/>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Vehicle Type</label>
                    <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                      <option value="Sedan">Sedan Car</option>
                      <option value="SUV">SUV / 4WD</option>
                      <option value="Truck">Delivery Truck</option>
                      <option value="Motorcycle">Motorcycle</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={form.parking_requested} onChange={(e) => setForm({ ...form, parking_requested: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded"/>
                      Request Gate Parking Space
                    </label>
                  </div>
                </div>)}
            </div>)}

          {/* ══════ STEP 7: VISITOR PHOTO CAPTURE ══════ */}
          {currentStep === 7 && (<div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-[#070c16] space-y-4">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center text-slate-400">
                {form.photo_url ? (<img src={form.photo_url} alt="Visitor" className="w-full h-full rounded-full object-cover"/>) : (<Camera className="w-10 h-10 text-indigo-400"/>)}
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-200 block">Take WebCam Snapshot or Upload Visitor Photo</span>
                <p className="text-[11px] text-slate-400">Recommended resolution 400x400 JPG/PNG</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm({ ...form, photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5"/> WebCam Capture
                </button>
                <button type="button" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5"/> Upload Image
                </button>
              </div>
            </div>)}

          {/* ══════ STEP 8: IDENTITY DOCUMENTS ══════ */}
          {currentStep === 8 && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Identity Document Type *</label>
                <select value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold">
                  <option value="National ID Card">National ID Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver's License</option>
                  <option value="Employee Badge">External Employee Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">ID Identification Number *</label>
                <input type="text" placeholder="ID Card or Passport Number" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"/>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Asset / Laptop Serial # (Optional)</label>
                <div className="relative">
                  <Laptop className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
                  <input type="text" placeholder="e.g. Dell XPS Serial #ABC-123" value={form.asset_serial} onChange={(e) => setForm({ ...form, asset_serial: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">ID Document Expiry Date</label>
                <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>
            </div>)}

          {/* ══════ STEP 9: REVIEW REGISTRATION ══════ */}
          {currentStep === 9 && (<div className="space-y-4">
              <div className="bg-[#070c16] border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-semibold">Visitor Name:</span>
                  <strong className="text-white font-bold">{form.first_name} {form.middle_name} {form.last_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Phone:</span>
                  <strong className="text-white font-mono">{form.phone || 'N/A'}</strong>
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
                  <span className="text-slate-500 block font-semibold">Host Employee ID:</span>
                  <strong className="text-amber-400 font-bold">{form.host_id ? `Host #${form.host_id}` : 'Selected'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Visit Purpose:</span>
                  <strong className="text-white font-bold">{form.visit_purpose}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/30">
                <input type="checkbox" id="confirm_terms" checked={form.confirmed_terms} onChange={(e) => setForm({ ...form, confirmed_terms: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded"/>
                <label htmlFor="confirm_terms" className="text-xs font-bold text-indigo-200 cursor-pointer">
                  I confirm all provided walk-in visitor details are accurate and verified at reception.
                </label>
              </div>
            </div>)}

          {/* ══════ STEP 10: CONFIRMATION ══════ */}
          {currentStep === 10 && registeredResult && (<div className="bg-[#070c16] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <BadgeCheck className="w-8 h-8"/>
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
                  <strong className="text-emerald-400 font-mono font-bold text-lg">{registeredResult.queue_number || 'Q-104'}</strong>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-indigo-400"/>
                  Print Visitor Badge
                </button>
                <button onClick={resetAll} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase">
                  Register Another Walk-In
                </button>
              </div>
            </div>)}
        </div>
      </div>

      {/* Bottom Navigation Control Bar */}
      <div className="bg-[#0b1220] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between mt-6">
        <button type="button" disabled={currentStep === 1 || currentStep === 10} onClick={handlePrev} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all ${currentStep === 1 || currentStep === 10
            ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}>
          <ChevronLeft className="w-4 h-4"/>
          <span>{t('form.previousStep', 'Previous Step')}</span>
        </button>

        {currentStep < 9 && (<button type="button" onClick={handleNext} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]">
            <span>{t('form.nextStep', 'Next Step')}</span>
            <ChevronRight className="w-4 h-4"/>
          </button>)}

        {currentStep === 9 && (<button type="button" disabled={loading} onClick={handleSubmitFinal} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]">
            <Send className="w-4 h-4"/>
            <span>{loading ? t('wizard.submitting', 'Registering...') : t('form.submitRegistration', 'Register & Submit >')}</span>
          </button>)}

        {currentStep === 10 && (<button type="button" onClick={resetAll} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all">
            <span>{t('form.create', 'Start New Registration')}</span>
          </button>)}
      </div>
    </div>);
}
