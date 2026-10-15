import React, { useState } from 'react';
import { Car, CheckCircle2, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VehicleCheckIn() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [form, setForm] = useState({
        fullName: '', email: '', phone: '', company: '',
        purpose: '', plateNumber: '', vehicleModel: '', vehicleColor: '', parkingSlot: '', badgeNumber: '', notes: ''
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
                `Vehicle Check-In`,
                form.plateNumber ? `Plate: ${form.plateNumber}` : '',
                form.vehicleModel ? `Model: ${form.vehicleModel} (${form.vehicleColor})` : '',
                form.parkingSlot ? `Parking Slot: ${form.parkingSlot}` : '',
                form.notes
            ].filter(Boolean).join(' | ');

            const res = await checkinApi.walkin({
                fullName: form.fullName, email: form.email, phone: form.phone,
                company: form.company, purpose: form.purpose || 'Vehicle Visitor',
                badgeNumber: form.badgeNumber || undefined, notes,
            });
            setSuccess(res.data.data);
            setForm({ fullName: '', email: '', phone: '', company: '', purpose: '', plateNumber: '', vehicleModel: '', vehicleColor: '', parkingSlot: '', badgeNumber: '', notes: '' });
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
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Car className="h-6 w-6 text-blue-500" />
                        <span>{isAm ? 'የተሽከርካሪ እና የመኪና ማቆሚያ መግቢያ' : 'Vehicle Check-In'}</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAm ? 'የተሽከርካሪ ጎብኝዎችን፣ የሰሌዳ ቁጥሮችን እና የተመደቡ የመኪና ማቆሚያ ቦታዎችን ይመዝግቡ' : 'Register vehicle visitors, plate numbers, and assigned parking slots'}
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
                            {isAm ? 'የተሽከርካሪ ጎብኝ በተሳካ ሁኔታ ገብቷል' : 'Vehicle Visitor Checked In'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">{success.visitorName}</p>
                        <p className="text-xs font-mono text-slate-400">Ref: {success.referenceCode}</p>
                        <button
                            onClick={() => setSuccess(null)}
                            className="mt-2 px-5 py-2 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition text-sm"
                        >
                            {isAm ? 'ሌላ ተሽከርካሪ አስገባ' : 'Check In Another Vehicle'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <Car className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {isAm ? 'የተሽከርካሪ እና የመኪና ማቆሚያ ዝርዝሮች' : 'Vehicle & Parking Details'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field
                                label={isAm ? 'የሰሌዳ ቁጥር' : 'License Plate Number'}
                                field="plateNumber"
                                placeholder="AA-3-B12345"
                                required
                            />
                            <Field
                                label={isAm ? 'የተሽከርካሪ ዓይነት እና ሞዴል' : 'Vehicle Make & Model'}
                                field="vehicleModel"
                                placeholder={isAm ? 'ቶዮታ ኮሮላ' : 'Toyota Corolla'}
                            />
                            <Field
                                label={isAm ? 'የተሽከርካሪ ቀለም' : 'Vehicle Color'}
                                field="vehicleColor"
                                placeholder={isAm ? 'ብርማ / ጥቁር' : 'Silver / Black'}
                            />
                            <Field
                                label={isAm ? 'የተመደበ የመኪና ማቆሚያ ቦታ' : 'Assigned Parking Slot'}
                                field="parkingSlot"
                                placeholder="P1-24"
                            />
                        </div>

                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 mt-2">
                            <CreditCard className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {isAm ? 'የአሽከርካሪ / የጎብኝ መረጃ' : 'Driver / Visitor Information'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field
                                label={isAm ? 'የአሽከርካሪ ሙሉ ስም' : 'Driver Full Name'}
                                field="fullName"
                                placeholder={isAm ? 'አበበ ቢቂላ' : 'Abebe Bikila'}
                                required
                            />
                            <Field
                                label={isAm ? 'ድርጅት' : 'Company'}
                                field="company"
                                placeholder={isAm ? 'የድርጅት ስም' : 'Company Name'}
                            />
                            <Field
                                label={isAm ? 'ስልክ ቁጥር' : 'Phone Number'}
                                field="phone"
                                placeholder="+251-9XX-XXX-XXX"
                            />
                            <Field
                                label={isAm ? 'ኢሜይል አድራሻ' : 'Email Address'}
                                field="email"
                                placeholder="driver@company.com"
                                type="email"
                            />
                            <Field
                                label={isAm ? 'የጉብኝት ዓላማ' : 'Purpose of Visit'}
                                field="purpose"
                                placeholder={isAm ? 'ዕቃ ማድረስ፣ ስብሰባ...' : 'Delivery, Executive Meeting...'}
                            />
                            <Field
                                label={isAm ? 'የጎብኝ ባጅ ቁጥር' : 'Visitor Pass/Badge #'}
                                field="badgeNumber"
                                placeholder="PARK-001"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                {isAm ? 'ተጨማሪ ማስታወሻዎች' : 'Additional Notes'}
                            </label>
                            <input
                                type="text"
                                value={form.notes}
                                onChange={e => set('notes', e.target.value)}
                                placeholder={isAm ? 'ተሳቢ፣ ልዩ ጭነት፣ በበር 2 መግቢያ...' : 'Trailer, special cargo, Gate 2 entry...'}
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !form.fullName.trim()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> {isAm ? 'በመመዝገብ ላይ...' : 'Registering...'}</>
                            ) : (
                                <><Car className="h-4 w-4" /> {isAm ? 'ተሽከርካሪውን መዝግብ እና አስገባ' : 'Register & Check In Vehicle'}</>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
