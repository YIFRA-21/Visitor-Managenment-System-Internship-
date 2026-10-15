import React, { useState } from 'react';
import { appointmentsApi } from '../../services/api';
import { useEnterpriseForm } from '../../hooks/useEnterpriseForm';
import { ValidationRules } from '../../services/validationService';
import FieldError from '../../components/common/FieldError';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorRegistration({ departments = [], employees = [] }) {
    const { t, language } = useLanguage();
    const isAm = language === 'am';
    const [successCode, setSuccessCode] = useState('');

    const { values, errors, handleChange, handleBlur, handleSubmit, setBackendErrors, isSubmitting, resetForm } = useEnterpriseForm({
        initialValues: {
            fullName: '',
            email: '',
            phone: '',
            company: '',
            idType: 'Passport',
            idNumber: '',
            deptId: '',
            hostId: '',
            purpose: '',
            date: '',
            start: '10:00',
            end: '11:00'
        },
        validationSchema: {
            fullName: (val) => ValidationRules.required(val, isAm ? 'ሙሉ ስም' : 'Full Name'),
            email: (val) => ValidationRules.required(val, isAm ? 'ኢሜይል' : 'Email') || ValidationRules.email(val),
            phone: (val) => ValidationRules.required(val, isAm ? 'ስልክ ቁጥር' : 'Phone Number') || ValidationRules.phone(val),
            idNumber: (val) => ValidationRules.required(val, isAm ? 'የመታወቂያ ቁጥር' : 'ID Number'),
            deptId: (val) => ValidationRules.required(val, isAm ? 'ክፍል' : 'Department'),
            hostId: (val) => ValidationRules.required(val, isAm ? 'አስተናጋጅ' : 'Host'),
            purpose: (val) => ValidationRules.required(val, isAm ? 'ዓላማ' : 'Purpose'),
            date: (val) => ValidationRules.required(val, isAm ? 'ቀን' : 'Date'),
            start: (val) => ValidationRules.required(val, isAm ? 'የመጀመሪያ ሰዓት' : 'Start Time'),
            end: (val) => ValidationRules.required(val, isAm ? 'የማብቂያ ሰዓት' : 'End Time'),
        },
        onSubmit: async (formData) => {
            try {
                const res = await appointmentsApi.create({
                    visitorName: formData.fullName,
                    visitorEmail: formData.email,
                    visitorPhone: formData.phone,
                    company: formData.company,
                    idType: formData.idType,
                    idNumber: formData.idNumber,
                    departmentId: parseInt(formData.deptId),
                    hostId: parseInt(formData.hostId),
                    purpose: formData.purpose,
                    scheduledStart: `${formData.date}T${formData.start}:00`,
                    scheduledEnd: `${formData.date}T${formData.end}:00`,
                    visitType: 'other',
                });
                setSuccessCode(res.data.referenceCode || res.data.data?.referenceCode || 'VMS-SUCCESS');
                resetForm();
            }
            catch (err) {
                setBackendErrors(err);
                if (!err.response?.data?.errors) {
                    throw new Error(err.response?.data?.error || (isAm ? 'ምዝገባው አልተሳካም። እባክዎ የቀን እና ሰዓት ትክክለኛነት ያረጋግጡ።' : 'Registration failed. Ensure date time format is valid.'));
                }
            }
        }
    });

    const safeEmployeesList = Array.isArray(employees) ? employees : [];
    const filteredHosts = safeEmployeesList.filter((e) => !values.deptId || e.department_id === parseInt(values.deptId));

    return (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl transition-all duration-300 hover:border-indigo-500/50">
            <div className="mb-8 pb-6 border-b border-slate-800 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-white">
                        {isAm ? 'ያለቀጠሮ የመጡ ጎብኝዎች ምዝገባ' : 'Walk-In Registration'}
                    </h1>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">
                        {isAm ? 'በመቀበያ በር ላይ ያለቀጠሮ የመጡ እንግዶችን ይመዝግቡ' : 'Register walk-in guests at reception gate'}
                    </p>
                </div>
                <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {isAm ? 'የመቀበያ ክፍል' : 'Receptionist Domain'}
                </div>
            </div>

            <div className="max-w-2xl bg-[#0b101b] border border-slate-800 rounded-xl p-6">
                <h2 className="text-base font-bold uppercase tracking-widest text-white border-b border-slate-900 pb-3 mb-6">
                    {isAm ? 'የእንግዳ መመዝገቢያ ቅጽ' : 'Walk-In Visitor Registration'}
                </h2>

                {successCode && (
                    <div className="mb-4 bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 p-4 rounded-lg text-xs">
                        {isAm ? 'ጎብኝው በተሳካ ሁኔታ ተመዝግቧል! የማረጋገጫ ባጅ ኮድ: ' : 'Visitor registered successfully! Reference Pass: '}
                        <span className="font-mono font-bold text-white tracking-widest">{successCode}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        {isAm ? '1. የግል መለያ መረጃዎች' : '1. Personal Credentials'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <input
                                id="reg-fullName"
                                name="fullName"
                                data-invalid={Boolean(errors.fullName)}
                                aria-invalid={Boolean(errors.fullName)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.fullName ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                placeholder={isAm ? 'ሙሉ ስም *' : 'Full Name *'}
                                value={values.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                onBlur={() => handleBlur('fullName')}
                            />
                            <FieldError error={errors.fullName} id="reg-fullName-error" />
                        </div>
                        <div>
                            <input
                                id="reg-email"
                                name="email"
                                type="email"
                                data-invalid={Boolean(errors.email)}
                                aria-invalid={Boolean(errors.email)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.email ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                placeholder={isAm ? 'ኢሜይል አድራሻ *' : 'Email Address *'}
                                value={values.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                onBlur={() => handleBlur('email')}
                            />
                            <FieldError error={errors.email} id="reg-email-error" />
                        </div>
                        <div>
                            <input
                                id="reg-phone"
                                name="phone"
                                data-invalid={Boolean(errors.phone)}
                                aria-invalid={Boolean(errors.phone)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.phone ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                placeholder={isAm ? 'ስልክ ቁጥር *' : 'Phone Number *'}
                                value={values.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                onBlur={() => handleBlur('phone')}
                            />
                            <FieldError error={errors.phone} id="reg-phone-error" />
                        </div>
                        <div>
                            <input
                                id="reg-company"
                                name="company"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                placeholder={isAm ? 'የድርጅት ስም' : 'Company Name'}
                                value={values.company}
                                onChange={(e) => handleChange('company', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select
                            id="reg-idType"
                            name="idType"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            value={values.idType}
                            onChange={(e) => handleChange('idType', e.target.value)}
                        >
                            <option value="Passport">{isAm ? 'ፓስፖርት' : 'Passport'}</option>
                            <option value="Driver License">{isAm ? 'መንጃ ፈቃድ' : 'Driver License'}</option>
                            <option value="National ID">{isAm ? 'ብሔራዊ መታወቂያ' : 'National ID'}</option>
                        </select>
                        <div>
                            <input
                                id="reg-idNumber"
                                name="idNumber"
                                data-invalid={Boolean(errors.idNumber)}
                                aria-invalid={Boolean(errors.idNumber)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.idNumber ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                placeholder={isAm ? 'የመታወቂያ ቁጥር *' : 'ID Identification Number *'}
                                value={values.idNumber}
                                onChange={(e) => handleChange('idNumber', e.target.value)}
                                onBlur={() => handleBlur('idNumber')}
                            />
                            <FieldError error={errors.idNumber} id="reg-idNumber-error" />
                        </div>
                    </div>

                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pt-4 border-t border-slate-900">
                        {isAm ? '2. አስተናጋጅ እና የሰዓት ዝርዝሮች' : '2. Host and Schedule Details'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <select
                                id="reg-deptId"
                                name="deptId"
                                data-invalid={Boolean(errors.deptId)}
                                aria-invalid={Boolean(errors.deptId)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none ${errors.deptId ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                value={values.deptId}
                                onChange={(e) => handleChange('deptId', e.target.value)}
                                onBlur={() => handleBlur('deptId')}
                            >
                                <option value="">{isAm ? 'የሚጎበኙትን ክፍል ይምረጡ *' : 'Select Target Department *'}</option>
                                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                            </select>
                            <FieldError error={errors.deptId} id="reg-deptId-error" />
                        </div>

                        <div>
                            <select
                                id="reg-hostId"
                                name="hostId"
                                data-invalid={Boolean(errors.hostId)}
                                aria-invalid={Boolean(errors.hostId)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none ${errors.hostId ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                value={values.hostId}
                                onChange={(e) => handleChange('hostId', e.target.value)}
                                onBlur={() => handleBlur('hostId')}
                            >
                                <option value="">{isAm ? 'አስተናጋጅ ሠራተኛ ይምረጡ *' : 'Select Host Member *'}</option>
                                {filteredHosts.map((h) => (<option key={h.id} value={h.id}>{h.full_name}</option>))}
                            </select>
                            <FieldError error={errors.hostId} id="reg-hostId-error" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <input
                                id="reg-date"
                                name="date"
                                type="date"
                                data-invalid={Boolean(errors.date)}
                                aria-invalid={Boolean(errors.date)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.date ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                value={values.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                onBlur={() => handleBlur('date')}
                            />
                            <FieldError error={errors.date} id="reg-date-error" />
                        </div>
                        <div>
                            <input
                                id="reg-start"
                                name="start"
                                type="time"
                                data-invalid={Boolean(errors.start)}
                                aria-invalid={Boolean(errors.start)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.start ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                value={values.start}
                                onChange={(e) => handleChange('start', e.target.value)}
                                onBlur={() => handleBlur('start')}
                            />
                            <FieldError error={errors.start} id="reg-start-error" />
                        </div>
                        <div>
                            <input
                                id="reg-end"
                                name="end"
                                type="time"
                                data-invalid={Boolean(errors.end)}
                                aria-invalid={Boolean(errors.end)}
                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono ${errors.end ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                                value={values.end}
                                onChange={(e) => handleChange('end', e.target.value)}
                                onBlur={() => handleBlur('end')}
                            />
                            <FieldError error={errors.end} id="reg-end-error" />
                        </div>
                    </div>

                    <div>
                        <textarea
                            id="reg-purpose"
                            name="purpose"
                            data-invalid={Boolean(errors.purpose)}
                            aria-invalid={Boolean(errors.purpose)}
                            className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono h-20 resize-none ${errors.purpose ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}
                            placeholder={isAm ? 'የጉብኝቱ/ስብሰባው ዓላማ *' : 'Purpose of Meeting *'}
                            value={values.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            onBlur={() => handleBlur('purpose')}
                        />
                        <FieldError error={errors.purpose} id="reg-purpose-error" />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        {isSubmitting
                            ? (isAm ? 'ፈቃድ በማዘጋጀት ላይ...' : 'Generating Pass...')
                            : (isAm ? 'የመግቢያ ፈቃድ አዘጋጅ' : 'Generate Walk-in Pass')}
                    </button>
                </form>
            </div>
        </div>
    );
}
