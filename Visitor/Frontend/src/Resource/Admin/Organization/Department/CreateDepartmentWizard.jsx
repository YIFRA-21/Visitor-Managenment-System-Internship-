import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Network, AlertCircle, CheckCircle, Clock, Building2, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../services/api';
import { useLanguage } from '../../../../contexts/LanguageContext';

const SHORT_DAYS = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun'
};

const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function CreateDepartmentWizard() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [codeStatus, setCodeStatus] = useState('idle');
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        departmentName: '',
        departmentCode: '',
        organizationId: '',
        branchId: '',
        departmentType: 'ADMINISTRATIVE',
        officeLocation: '',
        floor: '',
        officeNumber: '',
        telephoneExtension: '',
        description: '',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        openingTime: '08:30',
        closingTime: '17:30',
    });
    useEffect(() => {
        api.get('/organizations/search?limit=100').then(r => {
            const list = r.data.data || [];
            setOrganizations(list.filter((org) => (org.status || '').toUpperCase() === 'ACTIVE'));
        }).catch(() => { });
    }, []);
    useEffect(() => {
        if (formData.organizationId) {
            api.get(`/branches/search?organizationId=${formData.organizationId}&limit=100`)
                .then(r => {
                const list = r.data.data || [];
                if (list.length > 0) {
                    setBranches(list);
                }
                else {
                    api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([]));
                }
            })
                .catch(() => {
                api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([]));
            });
        }
        else {
            api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([]));
        }
    }, [formData.organizationId]);
    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'departmentCode') {
            value = (value || '').toUpperCase();
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name])
            setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };
    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            workingDays: prev.workingDays.includes(day)
                ? prev.workingDays.filter(d => d !== day)
                : [...prev.workingDays, day],
        }));
        if (fieldErrors.workingDays) {
            setFieldErrors(prev => { const n = { ...prev }; delete n.workingDays; return n; });
        }
    };
    const checkCodeUniqueness = async (code) => {
        const cleanCode = (code || '').trim().toUpperCase();
        if (!cleanCode || cleanCode.length < 2)
            return;
        setCodeStatus('checking');
        try {
            const res = await api.get(`/departments/check-code?code=${encodeURIComponent(cleanCode)}`);
            setCodeStatus(res.data.taken ? 'taken' : 'available');
            if (res.data.taken) {
                setFieldErrors(prev => ({ ...prev, departmentCode: isAm ? `የሥራ ክፍል መለያ ኮድ '${cleanCode}' አስቀድሞ ተይዟል።` : `Code '${cleanCode}' is already in use.` }));
            }
            else {
                setFieldErrors(prev => { const n = { ...prev }; delete n.departmentCode; return n; });
            }
        }
        catch {
            setCodeStatus('idle');
        }
    };
    const validateStep = (s) => {
        const errors = {};
        if (s === 1) {
            if (!formData.departmentName || formData.departmentName.trim().length < 2) {
                errors.departmentName = isAm ? 'የሥራ ክፍል ስም ያስፈልጋል (ቢያንስ 2 ፊደላት)።' : 'Department Name is required (min 2 characters).';
            }
            const cleanCode = (formData.departmentCode || '').trim().toUpperCase();
            if (!cleanCode || !/^[A-Z0-9_-]{2,20}$/i.test(cleanCode)) {
                errors.departmentCode = isAm ? 'የሥራ ክፍል መለያ ኮድ ፊደላት፣ ቁጥሮች ወይም ሰረዞች (2–20 ፊደላት) መሆን አለበት።' : 'Code must be alphanumeric/dashes (e.g. TE-9998), 2–20 chars.';
            } else {
                formData.departmentCode = cleanCode;
            }
            if (!formData.organizationId)
                errors.organizationId = isAm ? 'ድርጅት መመረጥ አለበት።' : 'Organization is required.';
            if (!formData.branchId)
                errors.branchId = isAm ? 'ቅርንጫፍ መመረጥ አለበት።' : 'Branch is required.';
            if (codeStatus === 'taken')
                errors.departmentCode = isAm ? `የሥራ ክፍል መለያ ኮድ '${cleanCode}' አስቀድሞ ተይዟል።` : `Code '${cleanCode}' is already in use.`;
        }
        if (s === 2) {
            if (!formData.officeLocation || formData.officeLocation.trim().length < 2) {
                errors.officeLocation = 'Office location is required.';
            }
        }
        if (s === 3) {
            if (!formData.workingDays || formData.workingDays.length === 0) {
                errors.workingDays = 'At least one working day required.';
            }
            if (!formData.openingTime)
                errors.openingTime = 'Opening time required.';
            if (!formData.closingTime)
                errors.closingTime = 'Closing time required.';
            if (formData.openingTime && formData.closingTime) {
                const [oH, oM] = formData.openingTime.split(':').map(Number);
                const [cH, cM] = formData.closingTime.split(':').map(Number);
                if (cH * 60 + cM <= oH * 60 + oM) {
                    errors.closingTime = 'Closing time must be after opening time.';
                }
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleNext = () => {
        setError('');
        if (validateStep(step))
            setStep(step + 1);
    };
    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/departments', {
                ...formData,
                organizationId: Number(formData.organizationId),
                branchId: Number(formData.branchId)
            });
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'departments_mgmt');
            window.location.search = `?${params.toString()}`;
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to create department.');
        }
        finally {
            setLoading(false);
        }
    };
    const renderFieldError = (field) => {
        if (!fieldErrors[field])
            return null;
        return (<div className="text-rose-400 text-xs mt-1.5 flex items-center gap-1.5 font-semibold">
        <AlertCircle className="h-3.5 w-3.5 shrink-0"/>
        <span className="break-words">{fieldErrors[field]}</span>
      </div>);
    };
    const goBack = () => {
        const p = new URLSearchParams(window.location.search);
        p.set('view', 'departments_mgmt');
        window.location.search = `?${p.toString()}`;
    };
    const stepsList = [
        { label: isAm ? 'መደበኛ' : 'General', num: 1, desc: isAm ? 'ስም እና ድርጅት' : 'Name & Organization' },
        { label: isAm ? 'የቢሮ ቦታ' : 'Operational', num: 2, desc: isAm ? 'ፎቅ እና አድራሻ' : 'Location & Floor' },
        { label: isAm ? 'የሥራ ሰዓት' : 'Schedule', num: 3, desc: isAm ? 'ሰዓቶች እና ቀናት' : 'Hours & Working Days' },
        { label: isAm ? 'ማረጋገጫ' : 'Review', num: 4, desc: isAm ? 'ዝርዝሮችን ያረጋግጡ' : 'Confirm Details' }
    ];
    return (<div className="space-y-6 w-full max-w-6xl mx-auto px-2 sm:px-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={goBack} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer" title="Back to Department Directory">
            <ArrowLeft className="h-4.5 w-4.5"/>
          </motion.button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Network className="text-indigo-400 h-6 w-6 sm:h-7 sm:w-7 shrink-0"/>
              <span>{isAm ? 'የሥራ ክፍል / ቡድን መመዝገቢያ ቅጽ' : 'Department / Team Registration'}</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium break-words">
              {isAm ? 'የክፍሉን ደረጃ፣ የሥራ ሰዓታት ሰሌዳ እና የቢሮ ቦታ ዝርዝሮችን ያዋቅሩ።' : 'Configure department hierarchy, operating schedule, and location details.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            Step {step} of 4
          </span>
        </div>
      </div>

      {/* Responsive Progress Stepper */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {stepsList.map(s => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (<motion.button key={s.num} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                    if (s.num < step)
                        setStep(s.num);
                }} className={`p-2.5 sm:p-3 rounded-xl text-left transition-all border cursor-pointer ${isActive
                    ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-600/20'
                    : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                        : 'bg-[#070c16] border-slate-800/80 text-slate-500 opacity-80'}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'}`}>
                    {isCompleted ? '✓' : s.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-bold block truncate ${isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:block truncate">
                      {s.desc}
                    </span>
                  </div>
                </div>
              </motion.button>);
        })}
        </div>
      </div>

      {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 font-semibold flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400"/>
          <span className="break-words">{error}</span>
        </motion.div>)}

      {/* Main Form Card with Step Transitions */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1 — General */}
          {step === 1 && (<motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400"/> General Information
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Specify basic department identification and organization assignment.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" name="departmentName" value={formData.departmentName} onChange={handleChange} placeholder="e.g. Human Resources" className={`w-full bg-[#070c16] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${fieldErrors.departmentName
                ? 'border-2 border-rose-500 bg-rose-950/20'
                : 'border border-slate-700 focus:border-indigo-500'}`}/>
                  {renderFieldError('departmentName')}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                    <input 
                      type="text" 
                      name="departmentCode" 
                      value={formData.departmentCode} 
                      onChange={(e) => {
                        const val = (e.target.value || '').toUpperCase();
                        setFormData(prev => ({ ...prev, departmentCode: val }));
                        if (fieldErrors.departmentCode) {
                          setFieldErrors(prev => { const n = { ...prev }; delete n.departmentCode; return n; });
                        }
                      }} 
                      onBlur={() => checkCodeUniqueness(formData.departmentCode)} 
                      placeholder="e.g. TE-9998" 
                      className={`w-full bg-[#070c16] font-mono text-white rounded-xl px-3.5 py-2.5 text-xs uppercase focus:outline-none transition-all ${fieldErrors.departmentCode
                        ? 'border-2 border-rose-500 bg-rose-950/20'
                        : codeStatus === 'available'
                            ? 'border-2 border-emerald-500 text-emerald-400'
                            : 'border border-slate-700 focus:border-indigo-500'}`}
                    />
                    {codeStatus === 'checking' && (<span className="absolute right-3 top-2.5 text-xs text-indigo-400 animate-spin">⟳</span>)}
                  </div>
                  {renderFieldError('departmentCode')}
                  {codeStatus === 'available' && !fieldErrors.departmentCode && (<div className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1 font-semibold">
                      <CheckCircle className="h-3.5 w-3.5"/> Code is available
                    </div>)}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Department Type <span className="text-rose-500">*</span>
                  </label>
                  <select name="departmentType" value={formData.departmentType} onChange={handleChange} className="w-full bg-[#070c16] text-white border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-medium">
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="SUPPORT">Support</option>
                    <option value="FINANCE">Finance</option>
                    <option value="HR">HR</option>
                    <option value="LEGAL">Legal</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Organization <span className="text-rose-500">*</span>
                  </label>
                  <select name="organizationId" value={formData.organizationId} onChange={handleChange} className={`w-full bg-[#070c16] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-medium transition-all ${fieldErrors.organizationId
                ? 'border-2 border-rose-500 bg-rose-950/20'
                : 'border border-slate-700 focus:border-indigo-500'}`}>
                    <option value="">Select Organization...</option>
                    {organizations.map((o) => (<option key={o.id} value={o.id} className="bg-[#0b1220]">
                        {o.name} {o.code ? `(${o.code})` : ''}
                      </option>))}
                  </select>
                  {renderFieldError('organizationId')}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Branch <span className="text-rose-500">*</span>
                  </label>
                  <select name="branchId" value={formData.branchId} onChange={handleChange} disabled={!formData.organizationId} className={`w-full bg-[#070c16] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-medium transition-all disabled:opacity-50 ${fieldErrors.branchId
                ? 'border-2 border-rose-500 bg-rose-950/20'
                : 'border border-slate-700 focus:border-indigo-500'}`}>
                    <option value="">{formData.organizationId ? 'Select Branch...' : 'Select an organization first'}</option>
                    {branches.map((b) => (<option key={b.id} value={b.id} className="bg-[#0b1220]">
                        {b.branchName} {b.branchCode ? `(${b.branchCode})` : ''}
                      </option>))}
                  </select>
                  {renderFieldError('branchId')}
                </div>
              </div>
            </motion.div>)}

          {/* Step 2 — Operational */}
          {step === 2 && (<motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400"/> Operational Information
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Physical location within company facilities and contact extension.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Office Location <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" name="officeLocation" value={formData.officeLocation} onChange={handleChange} placeholder="e.g. Building A, East Wing" className={`w-full bg-[#070c16] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${fieldErrors.officeLocation
                ? 'border-2 border-rose-500 bg-rose-950/20'
                : 'border border-slate-700 focus:border-indigo-500'}`}/>
                  {renderFieldError('officeLocation')}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Floor</label>
                  <input type="text" name="floor" value={formData.floor} onChange={handleChange} placeholder="e.g. 3rd Floor" className="w-full bg-[#070c16] text-white border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Office Number</label>
                  <input type="text" name="officeNumber" value={formData.officeNumber} onChange={handleChange} placeholder="e.g. Room A-301" className="w-full bg-[#070c16] text-white border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Telephone Extension</label>
                  <input type="text" name="telephoneExtension" value={formData.telephoneExtension} onChange={handleChange} placeholder="e.g. Ext 3001" className="w-full bg-[#070c16] text-white border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"/>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Description / Responsibilities</label>
                  <textarea name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Department mission, functional responsibilities, and team notes..." className="w-full bg-[#070c16] text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"/>
                </div>
              </div>
            </motion.div>)}

          {/* Step 3 — Schedule */}
          {step === 3 && (<motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400"/> Operating Schedule & Working Days
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Determine office opening and closing hours for visitor scheduling.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Working Days <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map(day => {
                const isSelected = formData.workingDays.includes(day);
                return (<motion.button key={day} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => toggleDay(day)} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-[#070c16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}`}>
                        {isSelected && '✓ '}
                        {SHORT_DAYS[day]}
                      </motion.button>);
            })}
                </div>
                {renderFieldError('workingDays')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Opening Time <span className="text-rose-500">*</span>
                  </label>
                  <input type="time" value={formData.openingTime} onChange={(e) => setFormData(p => ({ ...p, openingTime: e.target.value }))} className={`w-full bg-[#070c16] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${fieldErrors.openingTime
                ? 'border-2 border-rose-500 bg-rose-950/20'
                : 'border border-slate-700 focus:border-indigo-500'}`}/>
                  {renderFieldError('openingTime')}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Closing Time <span className="text-rose-500">*</span>
                  </label>
                  <input type="time" value={formData.closingTime} onChange={(e) => setFormData(p => ({ ...p, closingTime: e.target.value }))} className={`w-full bg-[#070c16] text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${fieldErrors.closingTime
                ? 'border-2 border-rose-500 bg-rose-950/20'
                : 'border border-slate-700 focus:border-indigo-500'}`}/>
                  {renderFieldError('closingTime')}
                </div>
              </div>

              {formData.workingDays.length > 0 && formData.openingTime && formData.closingTime && (<div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400 shrink-0"/>
                  <span className="break-words">
                    <strong>Weekly Schedule:</strong> {formData.workingDays.map(d => SHORT_DAYS[d]).join(', ')} ({formData.openingTime} – {formData.closingTime})
                  </span>
                </div>)}
            </motion.div>)}

          {/* Step 4 — Review */}
          {step === 4 && (<motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400"/> Review & Confirm Department
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Carefully verify all parameters before provisioning to directory.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* General Card */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">1. General</span>
                    <button type="button" onClick={() => setStep(1)} className="text-[10px] text-indigo-400 hover:underline font-bold">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Name</span>
                      <strong className="text-white break-words">{formData.departmentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Code</span>
                      <strong className="text-indigo-400 font-mono">{formData.departmentCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Type</span>
                      <span className="text-slate-300 font-semibold">{formData.departmentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Organization</span>
                      <span className="text-slate-300 break-words">
                        {organizations.find((o) => String(o.id) === String(formData.organizationId))?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Branch</span>
                      <span className="text-slate-300 break-words">
                        {branches.find((b) => String(b.id) === String(formData.branchId))?.branchName || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operational Card */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">2. Operational</span>
                    <button type="button" onClick={() => setStep(2)} className="text-[10px] text-indigo-400 hover:underline font-bold">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                      <strong className="text-white break-words">{formData.officeLocation}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Floor & Room</span>
                      <span className="text-slate-300">
                        {formData.floor || 'N/A'} / {formData.officeNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Telephone Extension</span>
                      <span className="text-slate-300 font-mono">{formData.telephoneExtension || 'N/A'}</span>
                    </div>
                    {formData.description && (<div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Description</span>
                        <p className="text-slate-400 text-[11px] break-words line-clamp-3">{formData.description}</p>
                      </div>)}
                  </div>
                </div>

                {/* Schedule Card */}
                <div className="p-4 bg-[#070c16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">3. Schedule</span>
                    <button type="button" onClick={() => setStep(3)} className="text-[10px] text-indigo-400 hover:underline font-bold">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Working Days</span>
                      <span className="text-white font-semibold break-words">
                        {formData.workingDays.map(d => SHORT_DAYS[d]).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Operating Hours</span>
                      <strong className="text-indigo-400 font-mono">
                        {formData.openingTime} – {formData.closingTime}
                      </strong>
                    </div>
                    <div className="pt-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Ready for Creation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>)}
        </AnimatePresence>

        {/* Wizard Navigation Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {step > 1 ? (<motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleBack} className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer">
              <ArrowLeft className="h-4 w-4"/> Previous
            </motion.button>) : (<div />)}

          {step < 4 ? (<motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleNext} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer">
              Next Step <ArrowRight className="h-4 w-4"/>
            </motion.button>) : (<motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer">
              {loading ? (<>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Creating Department...
                </>) : (<>
                  <Save className="h-4 w-4"/> Create Department
                </>)}
            </motion.button>)}
        </div>
      </div>
    </div>);
}
