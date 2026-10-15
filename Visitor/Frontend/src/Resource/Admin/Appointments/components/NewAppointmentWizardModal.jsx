import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function NewAppointmentWizardModal({ onClose, onSuccess }) {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [visitorName, setVisitorName] = useState('');
    const [visitorEmail, setVisitorEmail] = useState('');
    const [visitorPhone, setVisitorPhone] = useState('');
    const [company, setCompany] = useState('');
    const [category, setCategory] = useState('General Visitor');
    const [hostId, setHostId] = useState('2');
    const [hostName, setHostName] = useState('Security Officer');
    const [department, setDepartment] = useState('Security & Operations');
    const [roomId, setRoomId] = useState('1');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('11:00');
    const [purpose, setPurpose] = useState(isAm ? 'የሥራ ውይይት እና የቦታ ፍተሻ' : 'Business Meeting & Onsite Inspection');
    const [priority, setPriority] = useState('MEDIUM');
    const [remarks, setRemarks] = useState('');

    // Conflict & Verification Checks
    const [isBlacklisted, setIsBlacklisted] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);
    const [conflictMessage, setConflictMessage] = useState('');

    // Simulated live visitor check on step 1
    useEffect(() => {
        if (visitorEmail.toLowerCase().includes('black') || visitorName.toLowerCase().includes('blacklist')) {
            setIsBlacklisted(true);
        } else {
            setIsBlacklisted(false);
        }
    }, [visitorEmail, visitorName]);

    // Conflict re-validation on date/time change
    const validateScheduleConflict = () => {
        if (!date || !startTime || !endTime)
            return;
        // Simple conflict mock check
        if (startTime === '14:00' && roomId === '1') {
            setHasConflict(true);
            setConflictMessage(
                isAm
                    ? 'ስብሰባ አዳራሽ 1 ከ02:00 PM እስከ 03:00 PM ባለው ጊዜ ቀደም ሲል ተይዟል።'
                    : 'Meeting Room 1 is already reserved between 02:00 PM and 03:00 PM.'
            );
        } else {
            setHasConflict(false);
            setConflictMessage('');
        }
    };

    useEffect(() => {
        validateScheduleConflict();
    }, [date, startTime, endTime, roomId, hostId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isBlacklisted) return;
        if (hasConflict) return;
        setLoading(true);
        try {
            const scheduledStart = `${date}T${startTime}:00Z`;
            const scheduledEnd = `${date}T${endTime}:00Z`;
            const apptNum = `APT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
            const newAppt = {
                appointment_number: apptNum,
                visitorName,
                visitorEmail,
                visitorPhone,
                company,
                visitorCategory: category,
                host_id: parseInt(hostId),
                hostName,
                department,
                room_id: parseInt(roomId),
                roomName: roomId === '1' ? 'Conference Room A' : roomId === '2' ? 'Executive Suite B' : 'Boardroom C',
                scheduled_start: scheduledStart,
                scheduled_end: scheduledEnd,
                expected_duration_minutes: 60,
                purpose,
                priority,
                remarks,
                approval_status: 'PENDING',
                appointment_status: 'REQUESTED',
                reference_code: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            };

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                await fetch('/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        visitorName,
                        visitorEmail,
                        visitorPhone,
                        company,
                        hostId: parseInt(hostId),
                        roomId: parseInt(roomId),
                        purpose,
                        scheduledStart,
                        scheduledEnd,
                        priority,
                        remarks
                    })
                }).catch(() => { });
            }
            onSuccess(newAppt);
            onClose();
        } catch (err) {
            console.error('Failed to create appointment:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-white tracking-tight">
                                {isAm ? 'አዲስ ቀጠሮ መመዝገቢያ ቅጽ' : 'Schedule New Appointment'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isAm
                                    ? `ደረጃ ${step} ከ 3: ${step === 1 ? 'የጎብኝ መረጃ' : step === 2 ? 'አስተናጋጅ እና የሰዓት ሰሌዳ' : 'ማረጋገጫ እና ማስረከቢያ'}`
                                    : `Step ${step} of 3: ${step === 1 ? 'Visitor Selection' : step === 2 ? 'Host & Schedule' : 'Review & Submit'}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* STEP 1: VISITOR SELECTION */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                                {isAm ? '1. የጎብኝው እና የድርጅቱ መረጃ' : '1. Visitor & Organization Details'}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የጎብኝ ሙሉ ስም *' : 'Full Visitor Name *'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={visitorName}
                                        onChange={(e) => setVisitorName(e.target.value)}
                                        placeholder={isAm ? 'ምሳሌ፡ አበበ ከበደ' : 'e.g. John Doe'}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የጎብኝ ኢሜይል *' : 'Visitor Email *'}
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={visitorEmail}
                                        onChange={(e) => setVisitorEmail(e.target.value)}
                                        placeholder="visitor@company.com"
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'ስልክ ቁጥር' : 'Phone Number'}
                                    </label>
                                    <input
                                        type="text"
                                        value={visitorPhone}
                                        onChange={(e) => setVisitorPhone(e.target.value)}
                                        placeholder="+251-9XX-XXX-XXX"
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'ድርጅት / ተቋም' : 'Company / Organization'}
                                    </label>
                                    <input
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder={isAm ? 'የተቋሙ ስም' : 'Acme Inc.'}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">
                                    {isAm ? 'የጎብኝ ምድብ' : 'Visitor Category'}
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="General Visitor">{isAm ? 'መደበኛ ጎብኝ' : 'General Visitor'}</option>
                                    <option value="Contractor / Vendor">{isAm ? 'ውል ሰራተኛ / አቅራቢ' : 'Contractor / Vendor'}</option>
                                    <option value="VIP Guest">{isAm ? 'የክብር እንግዳ (VIP)' : 'VIP Guest'}</option>
                                    <option value="Auditor">{isAm ? 'ኦዲተር' : 'Auditor'}</option>
                                    <option value="Interview Candidate">{isAm ? 'የስራ ቃለ-መጠይቅ ተወዳዳሪ' : 'Interview Candidate'}</option>
                                </select>
                            </div>

                            {/* Blacklist Alert */}
                            {isBlacklisted && (
                                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-3 text-red-300 text-xs">
                                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                                    <div>
                                        <span className="font-extrabold uppercase block">
                                            {isAm ? 'የደህንነት ማስጠንቀቂያ፡ በጥቁር መዝገብ የተመዘገበ' : 'Security Alert: Blacklist Warning'}
                                        </span>
                                        {isAm
                                            ? 'ይህ ጎብኝ በደህንነት ጥቁር መዝገብ ላይ ካለ መረጃ ጋር ይዛመዳል። ቀጠሮ መያዝ የተከለከለ ነው።'
                                            : 'This visitor matches an active entry on the security watchlist. Scheduling is prohibited.'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: HOST, ROOM & TIME */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                                {isAm ? '2. አስተናጋጅ ሠራተኛ እና የመሰብሰቢያ አዳራሽ ሰሌዳ' : '2. Host Employee & Meeting Room Schedule'}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'አስተናጋጅ ሠራተኛ ይመድቡ *' : 'Assign Host Employee *'}
                                    </label>
                                    <select
                                        value={hostId}
                                        onChange={(e) => {
                                            setHostId(e.target.value);
                                            if (e.target.value === '2') {
                                                setHostName('Security Officer');
                                                setDepartment('Security & Operations');
                                            } else if (e.target.value === '4') {
                                                setHostName('Sarah Williams');
                                                setDepartment('IT Infrastructure');
                                            } else {
                                                setHostName('Michael Johnson');
                                                setDepartment('Executive Management');
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="2">Security Officer (Security & Ops)</option>
                                        <option value="4">Sarah Williams (IT Infrastructure)</option>
                                        <option value="5">Michael Johnson (Executive Management)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የስብሰባ ክፍል ይመድቡ' : 'Assign Meeting Room'}
                                    </label>
                                    <select
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="1">{isAm ? 'የስብሰባ አዳራሽ A (ህንፃ 1 - ፎቅ 2)' : 'Conference Room A (Building 1 - Flr 2)'}</option>
                                        <option value="2">{isAm ? 'የከፍተኛ አመራር ክፍል B (ዋና መ/ቤት - ፎቅ 3)' : 'Executive Suite B (HQ - Flr 3)'}</option>
                                        <option value="3">{isAm ? 'የቦርድ አዳራሽ C (ዋና መ/ቤት - ፎቅ 4)' : 'Boardroom C (HQ - Flr 4)'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የቀጠሮ ቀን *' : 'Appointment Date *'}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የመጀመሪያ ሰዓት *' : 'Start Time *'}
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የማብቂያ ሰዓት *' : 'End Time *'}
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Conflict Alert */}
                            {hasConflict && (
                                <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl flex items-center gap-3 text-amber-300 text-xs">
                                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                                    <div>
                                        <span className="font-extrabold uppercase block">
                                            {isAm ? 'የሰዓት መደራረብ ተገኝቷል' : 'Scheduling Conflict Detected'}
                                        </span>
                                        {conflictMessage}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: REVIEW & PURPOSE */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                                {isAm ? '3. የጉብኝቱ ዓላማ እና ቅድሚያ ማረጋገጫ' : '3. Visit Purpose & Priority Confirmation'}
                            </h4>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">
                                    {isAm ? 'የጉብኝቱ ዓላማ *' : 'Purpose of Visit *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder={isAm ? 'የስብሰባው ምክንያት...' : 'Reason for meeting...'}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የቅድሚያ ደረጃ' : 'Priority'}
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="LOW">{isAm ? 'ዝቅተኛ (Low)' : 'Low'}</option>
                                        <option value="MEDIUM">{isAm ? 'መካከለኛ (Medium)' : 'Medium'}</option>
                                        <option value="HIGH">{isAm ? 'ከፍተኛ (High)' : 'High'}</option>
                                        <option value="URGENT">{isAm ? 'አስቸኳይ (Urgent)' : 'Urgent'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        {isAm ? 'የውስጥ ማስታወሻ' : 'Internal Notes'}
                                    </label>
                                    <input
                                        type="text"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder={isAm ? 'ለመቀበያ ወይም ለደህንነት ሰራተኞች ማስታወሻ...' : 'Notes for reception or security...'}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                                <div className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">
                                    {isAm ? 'የቀጠሮው ማጠቃለያ' : 'Appointment Summary'}
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>{isAm ? 'ጎብኝ:' : 'Visitor:'}</span>
                                    <span className="text-white font-bold">{visitorName} ({category})</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>{isAm ? 'አስተናጋጅ እና ክፍል:' : 'Host & Dept:'}</span>
                                    <span className="text-white font-bold">{hostName} ({department})</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>{isAm ? 'የተያዘበት ሰዓት:' : 'Scheduled:'}</span>
                                    <span className="text-white font-bold">{date} • {startTime} - {endTime}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>{isAm ? 'የማጽደቅ ሂደት:' : 'Workflow:'}</span>
                                    <span className="text-amber-400 font-bold">
                                        {isAm ? 'ለደረጃ-በደረጃ ማጽደቂያ ይላካል' : 'Submits to Multi-Tier Approval'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
                        >
                            {isAm ? 'ተመለስ' : 'Back'}
                        </button>
                    ) : (<div></div>)}

                    {step < 3 ? (
                        <button
                            type="button"
                            disabled={isBlacklisted || (step === 2 && hasConflict)}
                            onClick={() => setStep(step + 1)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
                        >
                            {isAm ? 'ቀጣይ ደረጃ' : 'Next Step'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={loading || isBlacklisted || hasConflict}
                            onClick={handleSubmit}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30"
                        >
                            {loading
                                ? (isAm ? 'በማስገባት ላይ...' : 'Submitting...')
                                : (isAm ? 'አረጋግጥ እና ቀጠሮ ጠይቅ' : 'Confirm & Request Appointment')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
