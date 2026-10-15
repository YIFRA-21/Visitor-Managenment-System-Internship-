import React, { useState } from 'react';
import { Star, Zap, CheckCircle2, Loader2, AlertCircle, Crown } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VIPCheckIn() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [code, setCode] = useState('');
    const [notes, setNotes] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim())
            return;
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            const isRef = code.startsWith('VMS-') || code.startsWith('WLK-');
            const res = await checkinApi.scan(isRef
                ? { referenceCode: code.trim(), badgeNumber: badgeNumber || undefined, notes: `VIP Priority Check-In. ${notes}` }
                : { qrToken: code.trim(), badgeNumber: badgeNumber || undefined, notes: `VIP Priority Check-In. ${notes}` });
            setSuccess(res.data);
            setCode('');
            setBadgeNumber('');
            setNotes('');
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20 p-4 md:p-6 font-sans">
            <div className="max-w-xl mx-auto space-y-6">

                {/* Header */}
                <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-3">
                        <Crown className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                        {isAm ? 'የክብር እንግዶች (VIP) መግቢያ' : 'VIP Check-In'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isAm ? 'ለክብር እንግዶች የተዘጋጀ ፈጣን የመግቢያ መስመር' : 'Priority fast-track lane for VIP guests'}
                    </p>
                </div>

                {/* Priority Banner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {isAm
                            ? 'የክብር እንግዶች መግቢያ ከመደበኛ ወረፋ ውጪ ፈጣን ነው። እንግዳው እንደገባ አስተናጋጁ ወዲያውኑ ይገለጽለታል።'
                            : 'VIP processing bypasses standard queue. Host is notified immediately upon check-in.'}
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 text-center space-y-2">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                        <p className="text-xl font-black text-slate-800 dark:text-white">
                            {isAm ? 'የክብር እንግዳው መግቢያ ተጠናቋል' : 'VIP Guest Checked In'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">{success.visitorName}</p>
                        <p className="text-xs text-slate-400">
                            {isAm
                                ? <>አስተናጋጅ <strong>{success.hostName}</strong> መረጃው ደርሶታል</>
                                : <>Host <strong>{success.hostName}</strong> has been notified</>}
                        </p>
                        <button
                            onClick={() => setSuccess(null)}
                            className="mt-2 px-5 py-2 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition text-sm"
                        >
                            {isAm ? 'ሌላ የክብር እንግዳ አስገባ' : 'Check In Another VIP'}
                        </button>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-lg p-6 space-y-4">
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                                {isAm ? 'የQR ኮድ ወይም የቀጠሮ ማረጋገጫ ቁጥር' : 'QR Code / Reference Number'}
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                autoFocus
                                placeholder={isAm ? 'የQR ኮድ ይቃኙ ወይም የVMS-XXXX ቁጥር ያስገቡ...' : 'Scan QR or enter VMS-XXXX reference...'}
                                className="w-full px-3 py-3 border-2 border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                                {isAm ? 'የክብር ባጅ ቁጥር (Badge #)' : 'VIP Badge Number'}
                            </label>
                            <input
                                type="text"
                                value={badgeNumber}
                                onChange={e => setBadgeNumber(e.target.value)}
                                placeholder="VIP-001, GOLD-01..."
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                                {isAm ? 'ልዩ የማስተናገጃ ማስታወሻ' : 'Special Handling Notes'}
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                placeholder={isAm ? 'ምሳሌ፡ አጃቢ ያስፈልጋል፣ የከፍተኛ አመራር ቢሮ መግቢያ...' : 'e.g. Escort required, Executive Suite access...'}
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !code.trim()}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-base disabled:opacity-50"
                        >
                            {loading ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> {isAm ? 'በማስገባት ላይ...' : 'Processing VIP...'}</>
                            ) : (
                                <><Star className="h-5 w-5" /> {isAm ? 'ፈጣን የክብር እንግዳ መግቢያ አከናውን' : 'Fast-Track VIP Check-In'}</>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
