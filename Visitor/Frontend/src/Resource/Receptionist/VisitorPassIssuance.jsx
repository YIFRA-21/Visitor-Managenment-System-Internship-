import React, { useState } from 'react';
import { QrCode, Printer, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorPassIssuance() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [apptId, setApptId] = useState('');
    const [accessLevel, setAccessLevel] = useState('General Lobby Access');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [generatedPass, setGeneratedPass] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!apptId) {
            setMessage({
                type: 'error',
                text: isAm ? 'የጎብኝ ፈቃድ ለማዘጋጀት የቀጠሮ መለያ ቁጥር (Appointment ID) ያስፈልጋል።' : 'Appointment ID is required to generate a visitor pass.'
            });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const res = await api.post('/reception/passes/generate', {
                appointment_id: parseInt(apptId),
                access_level: accessLevel,
            });
            setGeneratedPass(res.data);
            setMessage({
                type: 'success',
                text: isAm ? 'የጎብኝ ባጅ ፈቃድ በተሳካ ሁኔታ ተዘጋጅቷል።' : 'Visitor pass issued successfully.'
            });
        }
        catch (err) {
            console.error(err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error || (isAm ? 'የጎብኝ ፈቃድ ማዘጋጀት አልተቻለም።' : 'Failed to issue visitor pass.')
            });
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
            {/* Header */}
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <BackButton fallbackUrl="/dashboard" />
                    <div>
                        <div className="flex items-center space-x-2">
                            <QrCode className="h-6 w-6 text-blue-400" />
                            <h1 className="text-xl font-black text-white tracking-tight uppercase">
                                {isAm ? 'የጎብኝዎች መግቢያ ባጅ ፈቃድ ማዘጋጃ' : 'Visitor Pass Issuance Workspace'}
                            </h1>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            {isAm
                                ? 'ዲጂታል የQR ባጆችን ያዘጋጁ፣ የህንፃ መግቢያ ፈቃድ ደረጃዎችን ይመድቡ እና አካላዊ የመግቢያ ባጆችን ያትሙ።'
                                : 'Generate digital QR badges, assign building access levels, and print physical visitor lobby passes.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert Banner */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                    <div className="flex items-center space-x-2 text-xs font-bold">
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Form Container */}
            <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto space-y-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-400" />
                    <span>{isAm ? 'የተፈቀደ የጎብኝ ባጅ አዘጋጅ' : 'Issue Approved Visitor Pass'}</span>
                </h2>

                <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">
                            {isAm ? 'የቀጠሮ መለያ ቁጥር (Appointment ID) *' : 'Appointment ID # *'}
                        </label>
                        <input
                            type="number"
                            required
                            placeholder="e.g. 1, 2, 3..."
                            value={apptId}
                            onChange={(e) => setApptId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 font-bold uppercase mb-1">
                            {isAm ? 'የህንፃ መግቢያ ፈቃድ ደረጃ' : 'Building Access Clearance Level'}
                        </label>
                        <select
                            value={accessLevel}
                            onChange={(e) => setAccessLevel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                        >
                            <option value="General Lobby Access">
                                {isAm ? 'አጠቃላይ የመቀበያ አዳራሽ መግቢያ (General Lobby)' : 'General Lobby Access'}
                            </option>
                            <option value="Floor 1-3 Standard Visitor">
                                {isAm ? 'ፎቅ 1-3 መደበኛ የጎብኝ መግቢያ (Floor 1-3 Standard)' : 'Floor 1-3 Standard Visitor Access'}
                            </option>
                            <option value="Floor 4-5 Executive Suite Access">
                                {isAm ? 'ፎቅ 4-5 የከፍተኛ አመራር ቢሮዎች (Floor 4-5 Executive)' : 'Floor 4-5 Executive Suite Access'}
                            </option>
                            <option value="Escorted Vendor Access Only">
                                {isAm ? 'ከአጃቢ ጋር ብቻ የሚፈቀድ (Escorted Vendor Access)' : 'Escorted Vendor Access Only'}
                            </option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                        >
                            <QrCode className="h-4 w-4" />
                            <span>
                                {loading
                                    ? (isAm ? 'ባጅ በማዘጋጀት ላይ...' : 'Generating Badge...')
                                    : (isAm ? 'ዲጂታል ፈቃድ እና የQR ኮድ አዘጋጅ' : 'Generate Digital Pass & QR')}
                            </span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Generated Pass Card Preview */}
            {generatedPass && (
                <div className="bg-[#0a0f19] border-2 border-blue-500/40 rounded-2xl p-6 shadow-2xl max-w-sm mx-auto text-center space-y-4">
                    <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                            {isAm ? 'የድርጅት የጎብኝ ባጅ' : 'Enterprise Visitor Pass'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">{generatedPass.pass_code}</span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center border-4 border-blue-500/40">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedPass.qr_token || generatedPass.pass_code)}`}
                            alt="Visitor Pass QR Code"
                            className="w-full h-full"
                        />
                    </div>

                    <div>
                        <p className="text-sm font-bold text-white uppercase">{generatedPass.pass_code}</p>
                        <p className="text-xs text-blue-400 font-mono mt-0.5">{generatedPass.access_level}</p>
                        <p className="text-[10px] text-slate-500 mt-2 uppercase font-semibold">
                            {isAm
                                ? 'በመቀበያ ዴስክ የተሰጠ • በ12 ሰዓታት ውስጥ ያበቃል'
                                : 'Issued by Lobby Reception • Expires in 12 Hours'}
                        </p>
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 shadow-lg"
                        >
                            <Printer className="h-4 w-4" />
                            <span>{isAm ? 'ባጅ አትም' : 'Print Badge'}</span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                        >
                            {isAm ? 'እንደገና አትም' : 'Reprint'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
