import React, { useState } from 'react';
import { HardHat, CheckCircle2, Loader2, AlertCircle, ClipboardList, Shield } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ContractorCheckIn() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [form, setForm] = useState({
        fullName: '', email: '', phone: '', company: '',
        purpose: '', workPermitNumber: '', accessAreas: '', supervisorName: '', badgeNumber: '', notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName.trim())
            return;
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            const notes = [
                `Contractor Check-In`,
                form.workPermitNumber ? `Work Permit: ${form.workPermitNumber}` : '',
                form.accessAreas ? `Access Areas: ${form.accessAreas}` : '',
                form.supervisorName ? `Supervisor: ${form.supervisorName}` : '',
                form.notes
            ].filter(Boolean).join(' | ');

            const res = await checkinApi.walkin({
                fullName: form.fullName, email: form.email, phone: form.phone,
                company: form.company, purpose: form.purpose || 'Contractor Work',
                badgeNumber: form.badgeNumber || undefined, notes,
            });
            setSuccess(res.data.data);
            setForm({ fullName: '', email: '', phone: '', company: '', purpose: '', workPermitNumber: '', accessAreas: '', supervisorName: '', badgeNumber: '', notes: '' });
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };

    const Field = ({ label, field, placeholder, type = 'text', required = false }) => (
        <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                {label}{required && ' *'}
            </label>
            <input
                type={type}
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <HardHat className="h-6 w-6 text-orange-500" />
                        <span>{isAm ? 'የኮንትራክተሮች እና የጥገና ሠራተኞች መግቢያ' : 'Contractor Check-In'}</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAm ? 'ውል ሰራተኞችን፣ ቴክኒሻኖችን እና የጥገና ባለሙያዎችን ይመዝግቡ' : 'Register contractors and maintenance personnel'}
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                )}

                {success ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 text-center space-y-2">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                        <p className="text-xl font-black text-slate-800 dark:text-white">
                            {isAm ? 'ኮንትራክተሩ በተሳካ ሁኔታ ገብቷል' : 'Contractor Checked In'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">{success.visitorName}</p>
                        <p className="text-xs font-mono text-slate-400">Ref: {success.referenceCode}</p>
                        <button
                            onClick={() => setSuccess(null)}
                            className="mt-2 px-5 py-2 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition text-sm"
                        >
                            {isAm ? 'ሌላ ኮንትራክተር አስገባ' : 'Check In Another'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <ClipboardList className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {isAm ? 'የኮንትራክተሩ መረጃ' : 'Contractor Information'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field
                                label={isAm ? 'ሙሉ ስም' : 'Full Name'}
                                field="fullName"
                                placeholder={isAm ? 'ምሳሌ፡ አበበ ከበደ' : 'John Smith'}
                                required
                            />
                            <Field
                                label={isAm ? 'ድርጅት / አሰሪ' : 'Company / Employer'}
                                field="company"
                                placeholder={isAm ? 'ምሳሌ፡ ኤቢሲ የጥገና ድርጅት' : 'ABC Services Ltd.'}
                            />
                            <Field
                                label={isAm ? 'ኢሜይል' : 'Email'}
                                field="email"
                                placeholder="name@company.com"
                                type="email"
                            />
                            <Field
                                label={isAm ? 'ስልክ ቁጥር' : 'Phone'}
                                field="phone"
                                placeholder="+251-9XX-XXX-XXX"
                            />
                        </div>

                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 mt-2">
                            <Shield className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {isAm ? 'የሥራ ዝርዝሮች' : 'Work Details'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field
                                label={isAm ? 'የሥራው ዓላማ' : 'Work Purpose'}
                                field="purpose"
                                placeholder={isAm ? 'የኤሌክትሪክ ጥገና፣ የኔትወርክ መስመር...' : 'Electrical maintenance, HVAC repair...'}
                            />
                            <Field
                                label={isAm ? 'የሥራ ፈቃድ ቁጥር' : 'Work Permit Number'}
                                field="workPermitNumber"
                                placeholder="WP-2026-XXXX"
                            />
                            <Field
                                label={isAm ? 'የሚገቡባቸው ክፍሎች' : 'Access Areas'}
                                field="accessAreas"
                                placeholder={isAm ? 'ፎቅ 3፣ የሰርቨር ክፍል...' : 'Floor 3, Server Room B...'}
                            />
                            <Field
                                label={isAm ? 'የሥራ ተቆጣጣሪ / ኃላፊ' : 'Site Supervisor'}
                                field="supervisorName"
                                placeholder={isAm ? 'የተቆጣጣሪው ስም' : "Supervisor's name"}
                            />
                            <Field
                                label={isAm ? 'የባጅ ቁጥር' : 'Badge Number'}
                                field="badgeNumber"
                                placeholder="CTR-001"
                            />
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                    {isAm ? 'ተጨማሪ ማስታወሻዎች' : 'Additional Notes'}
                                </label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={e => set('notes', e.target.value)}
                                    placeholder={isAm ? 'የደህንነት ቅድመ ሁኔታዎች፣ ልዩ መመሪያዎች...' : 'Safety requirements, special instructions...'}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !form.fullName.trim()}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> {isAm ? 'በመመዝገብ ላይ...' : 'Registering...'}</>
                            ) : (
                                <><HardHat className="h-4 w-4" /> {isAm ? 'ኮንትራክተሩን መዝግብ እና አስገባ' : 'Register & Check In Contractor'}</>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
