import React, { useState } from 'react';
import { Users, Plus, Trash2, Scan, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function GroupCheckIn() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [codes, setCodes] = useState([{ code: '', status: 'pending' }]);
    const [badgePrefix, setBadgePrefix] = useState('GRP');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [results, setResults] = useState([]);

    const addCode = () => setCodes(c => [...c, { code: '', status: 'pending' }]);
    const removeCode = (i) => setCodes(c => c.filter((_, idx) => idx !== i));
    const updateCode = (i, value) => setCodes(c => c.map((e, idx) => idx === i ? { ...e, code: value, status: 'pending' } : e));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validCodes = codes.map(c => c.code.trim()).filter(Boolean);
        if (validCodes.length === 0)
            return;
        setLoading(true);
        setError('');
        try {
            const res = await checkinApi.group({ codes: validCodes, badgePrefix: badgePrefix || undefined, notes: notes || undefined });
            const apiResults = res.data.results || [];
            setResults(apiResults);
            setCodes(c => c.map((entry, i) => {
                const r = apiResults.find((x) => x.code === entry.code.trim());
                return r ? { ...entry, status: r.status === 'success' ? 'success' : 'error', message: r.error || r.data?.visitorName, visitorName: r.data?.visitorName } : entry;
            }));
            setDone(true);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };

    const reset = () => { setCodes([{ code: '', status: 'pending' }]); setDone(false); setResults([]); setError(''); };
    const succeeded = results.filter(r => r.status === 'success').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-500" />
                        <span>{isAm ? 'የቡድን ጎብኝዎች በአንድ ላይ መግቢያ' : 'Group Check-In'}</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAm ? 'የአንድ ቡድን አባላትን በአንድ ጊዜ ያረጋግጡ እና ያስገቡ' : 'Process multiple visitors from the same group simultaneously'}
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                )}

                {done ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
                        <div className={`text-center p-4 rounded-xl ${succeeded === results.length ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                            <p className="text-3xl font-black text-slate-800 dark:text-white">{succeeded}/{results.length}</p>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                                {isAm ? 'ጎብኝዎች በተሳካ ሁኔታ ገብተዋል' : 'Visitors checked in successfully'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            {codes.filter(c => c.code.trim()).map((entry, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${entry.status === 'success' ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20' : 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20'}`}>
                                    {entry.status === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{entry.visitorName || entry.code}</p>
                                        {entry.status === 'error' && <p className="text-xs text-red-500">{entry.message}</p>}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">{entry.code}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={reset} className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm">
                            {isAm ? 'አዲስ የቡድን መግቢያ ጀምር' : 'Start New Group Check-In'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                    {isAm ? 'የባጅ መለያ መነሻ (Prefix)' : 'Badge Number Prefix'}
                                </label>
                                <input
                                    type="text"
                                    value={badgePrefix}
                                    onChange={e => setBadgePrefix(e.target.value)}
                                    placeholder="e.g. GRP"
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                    {isAm ? 'ማስታወሻ' : 'Notes'}
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={isAm ? 'የቡድን ጉብኝት ማስታወሻ...' : 'Group visit notes...'}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    {isAm ? 'የጎብኝዎች መለያ ኮዶች / የQR ቶከኖች' : 'Visitor Codes / QR Tokens'}
                                </label>
                                <span className="text-[10px] text-slate-400">
                                    {codes.length} {isAm ? 'ጎብኝዎች' : `visitor${codes.length !== 1 ? 's' : ''}`}
                                </span>
                            </div>
                            {codes.map((entry, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">{i + 1}</div>
                                    <input
                                        type="text"
                                        value={entry.code}
                                        onChange={e => updateCode(i, e.target.value)}
                                        placeholder={isAm ? `የጎብኝ ${i + 1} መለያ ወይም የQR ኮድ...` : `Reference code or QR token ${i + 1}...`}
                                        className="flex-1 px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                    />
                                    {codes.length > 1 && (
                                        <button type="button" onClick={() => removeCode(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addCode} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold mt-1 transition">
                                <Plus className="h-4 w-4" /> {isAm ? 'ጎብኝ ጨምር' : 'Add Visitor'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || codes.every(c => !c.code.trim())}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> {isAm ? `${codes.filter(c => c.code.trim()).length} ጎብኝዎችን በማስገባት ላይ...` : `Processing ${codes.filter(c => c.code.trim()).length} visitors...`}</>
                            ) : (
                                <><Scan className="h-4 w-4" /> {isAm ? `ሁሉንም የቡድን ጎብኝዎች አስገባ (${codes.filter(c => c.code.trim()).length})` : `Check In Group (${codes.filter(c => c.code.trim()).length} visitors)`}</>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
