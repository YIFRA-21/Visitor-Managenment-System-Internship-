import React, { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Printer, CheckCircle2, AlertCircle, Key, Search, User, 
    Building, Phone, Mail, Calendar, Shield, Sparkles, RefreshCw, 
    Copy, Download, ExternalLink, ChevronRight, Check, Award, Eye,
    Clock, CheckCheck, Scan, Smartphone, X, Building2, UserCheck
} from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { resolvePhotoUrl } from '../../utils/photoUtils';

export default function VisitorPassIssuance() {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    // Dynamic Organization & Company Branding (Auto-updates when changed in Admin)
    const { organization, logoUrl: orgLogoUrl, orgName: organizationName, refreshOrganization } = useOrganization();
    const companyLogo = orgLogoUrl || organization?.logoUrl || '/logo.png';
    const companyName = organizationName || organization?.name || 'Acme Enterprise';

    // ── Real Visitor Arrivals State ──
    const [arrivals, setArrivals] = useState([]);
    const [loadingArrivals, setLoadingArrivals] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [arrivalFilter, setArrivalFilter] = useState('ALL');

    // ── Selected Arrival & Visitor ──
    const [selectedArrival, setSelectedArrival] = useState(null);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // ── Badge Configuration Options ──
    const [accessLevel, setAccessLevel] = useState('General Lobby Access');
    const [badgeTitle, setBadgeTitle] = useState('Official Visitor');
    const [validityHours, setValidityHours] = useState('12');
    const [issuing, setIssuing] = useState(false);
    const [message, setMessage] = useState(null);
    const [generatedPass, setGeneratedPass] = useState(null);
    const [copied, setCopied] = useState(false);

    // ── Test Scan QR Modal State ──
    const [showScanModal, setShowScanModal] = useState(false);

    const badgeRef = useRef(null);

    // Auto-refresh company branding on mount & storage event
    useEffect(() => {
        if (typeof refreshOrganization === 'function') {
            refreshOrganization();
        }
        const handleStorageChange = (e) => {
            if (e.key === 'vms_org_branding' && typeof refreshOrganization === 'function') {
                refreshOrganization();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshOrganization]);

    // ── Fetch Real Visitor Arrivals from Database ──
    const fetchRealArrivals = async (query = '', filter = arrivalFilter) => {
        setLoadingArrivals(true);
        try {
            const res = await api.get(`/reception/arrivals?search=${encodeURIComponent(query)}&filter=${filter}`);
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setArrivals(list);
            if (list.length > 0) {
                // If a specific query was made, select the best match or first match
                handleSelectArrival(list[0]);
            }
        } catch (err) {
            console.error('Failed to fetch real visitor arrivals:', err);
        } finally {
            setLoadingArrivals(false);
        }
    };

    // Load arrivals on mount (reads any ?search=... from URL automatically)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search') || urlParams.get('ref') || '';
        if (searchParam) {
            setSearchQuery(searchParam);
            fetchRealArrivals(searchParam, 'ALL');
        } else {
            fetchRealArrivals('', 'ALL');
        }
    }, []);

    // Handle Search Submission
    const handleSearchSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        fetchRealArrivals(searchQuery.trim(), arrivalFilter);
    };

    // Handle Filter Switch (ALL / TODAY / ARRIVED)
    const handleFilterChange = (newFilter) => {
        setArrivalFilter(newFilter);
        fetchRealArrivals(searchQuery.trim(), newFilter);
    };

    // Handle Selecting a Real Arrived Visitor
    const handleSelectArrival = (arr) => {
        setSelectedArrival(arr);

        // Build active visitor profile object
        const vis = {
            id: arr.visitor_id || arr.id,
            visitor_id: arr.visitor_id || arr.id,
            full_name: arr.visitor_name || 'Arrived Guest',
            company: arr.visitor_company || arr.company || 'Private Guest',
            phone: arr.visitor_phone || arr.phone || '—',
            email: arr.visitor_email || arr.email || '—',
            photo_url: arr.visitor_photo || arr.photo_url || null,
            visitor_code: arr.visitor_code || `VIS-${arr.visitor_id || '001'}`,
            id_number: arr.id_number || '—'
        };
        setSelectedVisitor(vis);

        // Build active appointment object
        const appt = {
            id: arr.id,
            appointment_number: arr.appointment_number || arr.reference_code || `APT-${arr.id}`,
            reference_code: arr.reference_code || arr.appointment_number || 'REF-N/A',
            host_name: arr.host_name || 'Front Desk Staff',
            department_name: arr.department_name || 'Main Reception',
            scheduled_start: arr.scheduled_start,
            arrival_time: arr.arrival_time,
            purpose: arr.purpose || 'Official Visit'
        };
        setSelectedAppointment(appt);

        // If a pass already exists for this appointment
        if (arr.pass_code || arr.pass_id) {
            setGeneratedPass({
                pass_id: arr.pass_id,
                pass_code: arr.pass_code,
                qr_token: arr.qr_token || `QR-${arr.pass_code}`,
                access_level: arr.access_level || accessLevel,
                visitor_name: arr.visitor_name,
                visitor_photo: arr.visitor_photo,
                visitor_company: arr.visitor_company,
                host_name: arr.host_name,
                department_name: arr.department_name
            });
        } else {
            setGeneratedPass(null);
        }
    };

    // ── Issue / Generate Pass for Selected Real Visitor ──
    const handleGenerate = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!selectedVisitor) {
            setMessage({
                type: 'error',
                text: isAm ? 'እባክዎ መጀመሪያ ከደረሱ ጎብኝዎች ዝርዝር ውስጥ አንዱን ይምረጡ።' : 'Please select an arrived visitor from the real arrivals list first.'
            });
            return;
        }

        setIssuing(true);
        setMessage(null);
        try {
            const vId = selectedVisitor.visitor_id || selectedVisitor.id;
            const res = await api.post('/reception/passes/generate', {
                visitor_id: vId,
                userId: vId,
                appointment_id: selectedAppointment?.id || null,
                access_level: accessLevel,
                visitor_name: selectedVisitor.full_name,
                visitor_photo: selectedVisitor.photo_url,
                visitor_company: selectedVisitor.company,
                visitor_code: selectedVisitor.visitor_code,
                visitor_email: selectedVisitor.email,
                visitor_phone: selectedVisitor.phone,
                id_number: selectedVisitor.id_number,
                validity_hours: parseInt(validityHours, 10) || 12,
            });

            if (res.data) {
                setGeneratedPass(res.data);
                setMessage({
                    type: 'success',
                    text: isAm 
                        ? `የባለሙያ ባጅ ተዘጋጅቷል፡ ${selectedVisitor.full_name} (${res.data.pass_code || 'VP-SUCCESS'})` 
                        : `Official badge issued for ${selectedVisitor.full_name} (${res.data.pass_code || 'VP-SUCCESS'})`
                });
                // Refresh arrivals list to reflect issued pass code
                fetchRealArrivals(searchQuery.trim(), arrivalFilter);
            }
        } catch (err) {
            console.error('Badge generation error:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error || (isAm ? 'ባጅ ማዘጋጀት አልተቻለም።' : 'Failed to issue visitor badge.')
            });
        } finally {
            setIssuing(false);
        }
    };

    // Print Badge Function
    const handlePrint = () => {
        window.print();
    };

    // Copy Pass Code to Clipboard
    const handleCopyCode = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Computed Active Badge Values ──
    const activePassCode = generatedPass?.pass_code || (selectedAppointment?.appointment_number ? `VP-${selectedAppointment.id}` : `VP-${String(selectedVisitor?.id || '101').padStart(6, '0')}`);
    const activeQrToken = generatedPass?.qr_token || `QR-${activePassCode}`;
    const activeFullName = selectedVisitor?.full_name || 'Verified Visitor';
    const activePhoto = resolvePhotoUrl(selectedVisitor?.photo_url) || null;
    const activeIdNo = selectedVisitor?.visitor_code || selectedAppointment?.appointment_number || `ID-${selectedVisitor?.id || '001'}`;
    const activeCompany = selectedVisitor?.company || 'Official Guest';
    const activeEmail = selectedVisitor?.email || 'visitor@enterprise.com';
    const activePhone = selectedVisitor?.phone || '—';
    const activeHost = selectedAppointment?.host_name || 'Main Reception';
    const activeDepartment = selectedAppointment?.department_name || 'Security Lobby';
    
    // Format Arrival Time
    const activeArrivalTime = selectedAppointment?.arrival_time 
        ? new Date(selectedAppointment.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : (selectedAppointment?.scheduled_start ? new Date(selectedAppointment.scheduled_start).toLocaleDateString() : 'Today');

    const activeArrivalDate = selectedAppointment?.arrival_time 
        ? new Date(selectedAppointment.arrival_time).toLocaleDateString()
        : new Date().toLocaleDateString();

    // ── High-Clarity Scannable QR Code URL ──
    // Points directly to the public /verify-pass endpoint so any phone scanning reveals all visitor info!
    const scanVerificationUrl = `${window.location.origin}/verify-pass?code=${encodeURIComponent(activePassCode)}&token=${encodeURIComponent(activeQrToken)}&ref=${encodeURIComponent(selectedAppointment?.appointment_number || activeIdNo)}`;
    
    // High-resolution, clear & neat QR code generated with clean white margin
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(scanVerificationUrl)}`;

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans print:bg-white print:p-0 print:m-0">
            
            {/* ── HEADER BANNER (HIDDEN ON PRINT) ── */}
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <BackButton fallbackUrl="/dashboard" title={isAm ? 'ወደ ዳሽቦርድ' : 'Back to Dashboard'} />
                    <div>
                        <div className="flex items-center space-x-2.5">
                            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shadow-sm">
                                <QrCode className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-black text-white tracking-tight uppercase">
                                        {isAm ? 'የደረሱ ጎብኝዎች ባጅ ፈቃድ ማዘጋጃ' : 'Real Visitor Arrivals & Badge Studio'}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowScanModal(true)}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 shadow cursor-pointer transition-all active:scale-95"
                    >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>{isAm ? 'የQR ስካን ውጤት እይ' : 'Test Mobile Scan'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{isAm ? 'ባጅ አትም' : 'Print Badge'}</span>
                    </button>
                </div>
            </div>

            {/* ── NOTIFICATION / ALERT BANNER ── */}
            {message && (
                <div className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg print:hidden ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                    <div className="flex items-center space-x-2.5 text-xs font-bold">
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer p-1">✕</button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 1: SEARCH & SELECT REAL VISITOR ARRIVALS (DATABASE-BACKED)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 print:hidden relative overflow-hidden">
                <div style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)' }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                {isAm ? '1. ትክክለኛ የደረሱ ጎብኝዎችን ይፈልጉ (Search Real Visitor Arrivals)' : '1. Search Real Visitor Arrivals'}
                            </h2>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {isAm 
                                ? 'በስም፣ በቀጠሮ ቁጥር (APT-WALKIN...)፣ በስልክ ወይም በጎብኝ መለያ ይፈልጉ' 
                                : 'Search actual arrived visitors by Name, Appointment #, Visitor Code, Phone, or Company'}
                        </p>
                    </div>

                    {/* Filter Tabs & Search Form */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">

                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:w-80">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={isAm ? "ስም፣ ቀጠሮ ኮድ፣ ስልክ ይፈልጉ..." : "Search name, APT-WALKIN..., phone..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 focus:border-blue-500 rounded-2xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loadingArrivals}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer shrink-0 transition-all"
                            >
                                {loadingArrivals ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                <span>{isAm ? 'ፈልግ' : 'Search'}</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Real Arrived Visitors List (Interactive Grid) */}
                <div className="pt-2 border-t border-slate-800/80">
                    {loadingArrivals ? (
                        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                            <span className="text-xs font-semibold">{isAm ? 'የደረሱ ጎብኝዎችን ከመረጃ ቋት በመፈለግ ላይ...' : 'Loading verified arrivals from database...'}</span>
                        </div>
                    ) : arrivals.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-medium space-y-2">
                            <User className="w-8 h-8 text-slate-600 mx-auto opacity-60" />
                            <p>{isAm ? 'ምንም የደረሱ ጎብኝዎች አልተገኙም። እባክዎ በፍለጋ ሳጥኑ ሌላ ስም ወይም ኮድ ያስገቡ።' : 'No real arrivals match your search criteria. Please try another name or code.'}</p>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); fetchRealArrivals('', 'ALL'); }}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                                {isAm ? 'ሁሉንም ጎብኝዎች አሳይ' : 'Show All Real Arrivals'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                            {arrivals.map((arr) => {
                                const isSelected = selectedArrival && selectedArrival.id === arr.id;
                                const photo = resolvePhotoUrl(arr.visitor_photo);
                                const arrTime = arr.arrival_time 
                                    ? new Date(arr.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Arrived';

                                return (
                                    <div
                                        key={arr.id}
                                        onClick={() => handleSelectArrival(arr)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden ${
                                            isSelected 
                                                ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500' 
                                                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        {/* Visitor Avatar */}
                                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                            {photo ? (
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-900 text-blue-200 flex items-center justify-center font-bold text-xs uppercase">
                                                    {(arr.visitor_name || 'V').slice(0, 2)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Visitor Arrival Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <h4 className="text-xs font-bold text-white truncate leading-tight">
                                                    {arr.visitor_name || 'Visitor'}
                                                </h4>
                                                {isSelected && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-amber-400/90 font-mono font-medium truncate mt-0.5">
                                                {arr.appointment_number || arr.reference_code || `APT-${arr.id}`}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                                <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                                                    <Clock className="w-2.5 h-2.5" /> {arrTime}
                                                </span>
                                                <span className="truncate max-w-[80px] text-right font-medium">
                                                    {arr.host_name ? `Host: ${arr.host_name.split(' ')[0]}` : 'Lobby'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TWO-COLUMN WORKSPACE: LEFT DISPLAY/CONFIG + RIGHT PRINTABLE LANYARD BADGE
                ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── LEFT COLUMN: VISITOR DETAILS & PASS ISSUANCE CONTROLS (PRINT HIDDEN) ── */}
                <div className="lg:col-span-6 space-y-6 print:hidden">
                    
                    {/* STEP 2: DISPLAY VISITOR INFORMATION */}
                    <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                        <div style={{ backgroundColor: '#10b981', boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)' }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl" />
                        
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                                    <User className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                        {isAm ? '2. የደረሰው ጎብኝ ሙሉ መረጃ' : '2. Arrived Visitor Profile Information'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        {isAm ? 'በቀጥታ ከመረጃ ቋት የተገኘ የጎብኝ ዝርዝር' : 'Verified credentials loaded from arrival record'}
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {selectedVisitor ? 'Arrival Confirmed' : 'Select Visitor'}
                            </span>
                        </div>

                        {selectedVisitor ? (
                            <div className="space-y-4">
                                {/* Visitor Hero Card */}
                                <div className="flex items-center gap-4 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-800 shrink-0 shadow-md flex items-center justify-center">
                                        {activePhoto ? (
                                            <img 
                                                src={activePhoto} 
                                                alt={activeFullName} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-slate-900 text-indigo-300 flex items-center justify-center font-black text-lg">
                                                {activeFullName.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-base font-black text-white truncate">{activeFullName}</h4>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 border border-blue-800/50 text-blue-300">
                                                {activeIdNo}
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-400 font-semibold mt-0.5 flex items-center gap-1.5">
                                            <Building className="w-3.5 h-3.5 text-amber-400" /> {activeCompany}
                                        </p>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap font-medium">
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {activeEmail}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {activePhone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Comprehensive Information Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-emerald-400" /> {isAm ? 'የመድረሻ ሰዓት' : 'Arrival Timestamp'}
                                        </span>
                                        <span className="font-mono font-bold text-emerald-400 block">{activeArrivalTime} ({activeArrivalDate})</span>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                            <UserCheck className="w-3 h-3 text-blue-400" /> {isAm ? 'አስተናጋጅ ሰራተኛ' : 'Assigned Host'}
                                        </span>
                                        <span className="font-bold text-slate-200 truncate block">{activeHost}</span>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                            <Building2 className="w-3 h-3 text-indigo-400" /> {isAm ? 'የስራ ክፍል' : 'Department'}
                                        </span>
                                        <span className="font-semibold text-slate-300 truncate block">{activeDepartment}</span>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                            <Shield className="w-3 h-3 text-purple-400" /> {isAm ? 'የጉብኝት አላማ' : 'Visit Purpose'}
                                        </span>
                                        <span className="font-semibold text-slate-300 truncate block">{selectedAppointment?.purpose || 'Official Business'}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-slate-400 text-xs font-medium">
                                <User className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                                <p>{isAm ? 'መረጃውን ለመመልከት ከላይ ከደረሱ ጎብኝዎች ዝርዝር ውስጥ አንዱን ይምረጡ።' : 'Please select a visitor from the arrivals list above.'}</p>
                            </div>
                        )}
                    </div>

                    {/* STEP 3: CLEARANCE & BADGE CONFIGURATION */}
                    <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                        <div style={{ backgroundColor: '#a855f7', boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)' }} className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-3xl" />
                        
                        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800/80">
                            <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                                <Shield className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                                    {isAm ? '3. የባጅ እና የፈቃድ ማዘጋጃ ቅንብሮች' : '3. Clearance & Pass Activation'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    {isAm ? 'የመግቢያ ፈቃድ ደረጃ፣ ማዕረግ እና የቆይታ ጊዜ ያዘጋጁ' : 'Configure access zones, badge role, and validity duration'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                            {/* Clearance Level Selector */}
                            <div>
                                <label className="block text-slate-400 font-bold uppercase mb-1.5 text-[11px]">
                                    {isAm ? 'የህንፃ መግቢያ ፈቃድ ደረጃ (Building Access Clearance)' : 'Building Access Clearance Level'}
                                </label>
                                <select
                                    value={accessLevel}
                                    onChange={(e) => setAccessLevel(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-3.5 py-3 text-white focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                                >
                                    <option value="General Lobby Access">General Lobby Access (Ground Floor)</option>
                                    <option value="Floor 1-3 Standard Visitor">Floor 1-3 Standard Visitor Access</option>
                                    <option value="Floor 4-5 Executive Suite Access">Floor 4-5 Executive Suite Access</option>
                                    <option value="IT & Data Center Escorted Access">IT & Data Center Escorted Access</option>
                                    <option value="Escorted Vendor Access Only">Escorted Vendor Access Only</option>
                                </select>
                            </div>

                            {/* Badge Role Subtitle & Validity Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1.5 text-[11px]">
                                        {isAm ? 'የባጅ ማዕረግ (Role Subtitle)' : 'Badge Role Subtitle'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Official Visitor, Auditor, VIP"
                                        value={badgeTitle}
                                        onChange={(e) => setBadgeTitle(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-3.5 py-3 text-white font-medium focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 font-bold uppercase mb-1.5 text-[11px]">
                                        {isAm ? 'የፈቃድ ቆይታ (Validity Period)' : 'Pass Validity Duration'}
                                    </label>
                                    <select
                                        value={validityHours}
                                        onChange={(e) => setValidityHours(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-3.5 py-3 text-white font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
                                    >
                                        <option value="12">12 Hours (Standard Day Pass)</option>
                                        <option value="24">24 Hours (Full Day Access)</option>
                                        <option value="72">3 Days (Multi-Day Visitor)</option>
                                        <option value="168">7 Days (Weekly Contractor Pass)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Generate & Issue Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={issuing || !selectedVisitor}
                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {issuing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>{isAm ? 'ባጅ በማዘጋጀት ላይ...' : 'Issuing Badge & Activating Pass...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-amber-300" />
                                            <span>{isAm ? 'ባጅ አዘጋጅ እና ፈቃድ አስጀምር' : 'Issue Official Badge & Activate Pass'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: ULTRA-PROFESSIONAL LANYARD ID BADGE & CLEAR NEAT QR CODE ── */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                    
                    {/* Action Bar Above Badge */}
                    <div className="w-full max-w-sm flex items-center justify-between mb-2 text-xs font-semibold px-2 print:hidden">
                        <span className="text-slate-400 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-400" />
                            {isAm ? 'የታተመ የባጅ እይታ' : 'Official Lanyard ID Badge'}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowScanModal(true)}
                                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Preview what scanning this QR code shows"
                            >
                                <Scan className="w-3 h-3 text-emerald-400" />
                                <span>Scan Preview</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(activePassCode)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Copied' : 'Pass Code'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow transition-colors cursor-pointer"
                            >
                                <Printer className="w-3 h-3" />
                                <span>Print</span>
                            </button>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        ULTRA-REALISTIC 3D LANYARD BADGE (PRINT-OPTIMIZED)
                        ══════════════════════════════════════════════════════════════════ */}
                    <div ref={badgeRef} className="w-full max-w-[340px] sm:max-w-[360px] flex flex-col items-center select-none print:max-w-none print:w-[320px] print:mx-auto">
                        
                        {/* 1. LANYARD STRAP (DEEP BLUE WOVEN RIBBON) */}
                        <div className="w-12 h-16 sm:h-20 relative overflow-hidden flex flex-col items-center shadow-md">
                            <div className="w-full h-full bg-gradient-to-b from-[#0b1b3b] via-[#102756] to-[#0e2149] border-x border-blue-400/20 relative">
                                <div className="absolute inset-y-0 left-1 w-0.5 border-r border-dotted border-white/20" />
                                <div className="absolute inset-y-0 right-1 w-0.5 border-l border-dotted border-white/20" />
                            </div>
                        </div>

                        {/* 2. CHROME METALLIC SWIVEL LOBSTER CLAMP / CLIP */}
                        <div className="flex flex-col items-center -mt-1 z-20">
                            <div className="w-8 h-2.5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-sm shadow-sm border border-slate-300" />
                            <div className="w-4 h-3 rounded-full border-2 border-slate-300 bg-gradient-to-b from-slate-200 to-slate-400 -mt-0.5 shadow" />
                            <div className="w-6 h-7 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 rounded-b-xl border border-slate-300 shadow-md relative -mt-0.5 flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-slate-600 rounded-full absolute -right-0.5 top-1" />
                                <div className="w-2.5 h-4 rounded-full border border-slate-400/80 bg-slate-900/40" />
                            </div>
                        </div>

                        {/* 3. FROSTED CLEAR ACRYLIC BADGE HOLDER / SLEEVE */}
                        <div className="w-full bg-slate-900/40 backdrop-blur-md border-2 border-slate-700/60 rounded-[30px] p-2.5 sm:p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative -mt-2 z-10 print:bg-white print:border-slate-300 print:shadow-none">
                            
                            {/* Acrylic Holder Punch Hole Slots */}
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="w-6 h-1.5 bg-slate-950/80 rounded-full border border-slate-700/60" />
                                <div className="w-14 h-3 bg-slate-950/90 rounded-full border border-slate-600/80 flex items-center justify-center shadow-inner">
                                    <div className="w-2 h-2 rounded-full bg-slate-400/40" />
                                </div>
                                <div className="w-6 h-1.5 bg-slate-950/80 rounded-full border border-slate-700/60" />
                            </div>

                            {/* 4. THE INTERIOR BADGE CARD (EXECUTIVE NAVY & GOLD) */}
                            <div className="w-full bg-[#07132a] rounded-[22px] overflow-hidden border border-slate-800 text-white relative shadow-2xl flex flex-col justify-between">
                                
                                {/* Background Hex Geometric Ambient Accents */}
                                <div className="absolute inset-0 pointer-events-none opacity-20">
                                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id="hexGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M20 0 L40 11.5 L40 34.5 L20 46 L0 34.5 L0 11.5 Z" fill="none" stroke="#f59e0b" strokeWidth="0.5"/>
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#hexGrid)" />
                                    </svg>
                                </div>

                                {/* TOP SECTION: DYNAMIC COMPANY LOGO & HEADER (AUTO-UPDATES) */}
                                <div className="pt-4 pb-2 px-4 flex flex-col items-center text-center relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5)] border border-white/50 mb-1.5 overflow-hidden shrink-0">
                                        {companyLogo ? (
                                            <img 
                                                src={companyLogo} 
                                                alt={`${companyName} Logo`}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/logo.png';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg viewBox="0 0 100 100" className="w-8 h-8">
                                                    <defs>
                                                        <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#10b981"/>
                                                            <stop offset="50%" stopColor="#f59e0b"/>
                                                            <stop offset="100%" stopColor="#ef4444"/>
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M50,10 L85,25 C85,60 50,85 50,85 C50,85 15,60 15,25 Z" fill="none" stroke="url(#shieldGrad)" strokeWidth="7" strokeLinejoin="round" />
                                                    <text x="50" y="56" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f172a" fontFamily="sans-serif">VMS</text>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-[12px] font-black uppercase tracking-wider text-white leading-tight drop-shadow-sm max-w-[220px] truncate">
                                        {companyName}
                                    </h4>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 mt-0.5">
                                        OFFICIAL VISITOR PASS
                                    </span>
                                </div>

                                {/* CENTER SECTION: DUAL-CURVED RIBBON ARCS & CIRCULAR VISITOR PHOTO */}
                                <div className="relative my-2 flex items-center justify-center">
                                    
                                    {/* Sweeping Ribbon Arcs */}
                                    <div className="absolute inset-x-0 h-28 pointer-events-none flex items-center justify-center">
                                        <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full">
                                            <path 
                                                d="M 0,90 Q 200,-10 400,90 L 400,105 Q 200,5 0,105 Z" 
                                                fill="#ffffff" 
                                                opacity="0.95" 
                                            />
                                            <path 
                                                d="M 0,105 Q 200,5 400,105 L 400,122 Q 200,22 0,122 Z" 
                                                fill="url(#goldRibbonGradient)" 
                                            />
                                            <defs>
                                                <linearGradient id="goldRibbonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#d97706" />
                                                    <stop offset="50%" stopColor="#fbbf24" />
                                                    <stop offset="100%" stopColor="#f59e0b" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>

                                    {/* Circular Frame for User Photo */}
                                    <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-b from-white via-amber-300 to-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.45)]">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-900 flex items-center justify-center">
                                            {activePhoto ? (
                                                <img 
                                                    src={activePhoto} 
                                                    alt={activeFullName} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-slate-900 text-amber-300 flex items-center justify-center font-black text-2xl uppercase">
                                                    {activeFullName.slice(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* VISITOR NAME & ROLE SUBTITLE */}
                                <div className="text-center px-4 pt-1 pb-3 relative z-10">
                                    <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight leading-tight uppercase drop-shadow-sm break-words">
                                        {activeFullName}
                                    </h2>
                                    <p className="text-xs font-semibold italic text-slate-200 tracking-wide mt-0.5">
                                        {badgeTitle || activeCompany}
                                    </p>
                                </div>

                                {/* KEY-VALUE CREDENTIALS TABLE */}
                                <div className="px-6 py-2 relative z-10 text-[11px] font-medium space-y-1 text-slate-200">
                                    <div className="grid grid-cols-12 items-baseline">
                                        <span className="col-span-4 text-slate-400 font-bold uppercase text-[10px]">ID No</span>
                                        <span className="col-span-1 text-slate-400 font-bold text-center">:</span>
                                        <span className="col-span-7 font-mono font-bold text-white tracking-wider truncate">{activeIdNo}</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-baseline">
                                        <span className="col-span-4 text-slate-400 font-bold uppercase text-[10px]">Arrival</span>
                                        <span className="col-span-1 text-slate-400 font-bold text-center">:</span>
                                        <span className="col-span-7 font-mono font-bold text-emerald-300 truncate">{activeArrivalTime} ({activeArrivalDate})</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-baseline">
                                        <span className="col-span-4 text-slate-400 font-bold uppercase text-[10px]">Host</span>
                                        <span className="col-span-1 text-slate-400 font-bold text-center">:</span>
                                        <span className="col-span-7 text-white font-semibold truncate">{activeHost}</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-baseline">
                                        <span className="col-span-4 text-slate-400 font-bold uppercase text-[10px]">Phone</span>
                                        <span className="col-span-1 text-slate-400 font-bold text-center">:</span>
                                        <span className="col-span-7 font-mono text-slate-200 truncate text-[10px]">{activePhone}</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-baseline">
                                        <span className="col-span-4 text-slate-400 font-bold uppercase text-[10px]">Clearance</span>
                                        <span className="col-span-1 text-slate-400 font-bold text-center">:</span>
                                        <span className="col-span-7 text-amber-300 font-bold truncate text-[10px]">{accessLevel}</span>
                                    </div>
                                </div>

                                {/* ── CLEAR & NEAT HIGH-RES QR CODE SECTION ── */}
                                <div className="mt-3 pt-2 pb-3 px-4 bg-white text-slate-900 text-center flex flex-col items-center justify-center relative">
                                    
                                    {/* Realistic Barcode Stripes */}
                                    <div className="w-full flex items-center justify-between px-2 h-7 overflow-hidden">
                                        {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,4,1,2,1,3,2,1].map((w, i) => (
                                            <div 
                                                key={i} 
                                                style={{ width: `${w * 1.6}px` }} 
                                                className={`h-full ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`} 
                                            />
                                        ))}
                                    </div>

                                    {/* Barcode Number & Pass Code */}
                                    <div className="flex items-center justify-between w-full px-3 text-[9px] font-mono font-bold text-slate-800 tracking-wider mb-2">
                                        <span>{activePassCode}</span>
                                        <span className="text-[8px] uppercase text-slate-500 font-sans truncate max-w-[150px]">{companyName}</span>
                                        <span>{activeIdNo}</span>
                                    </div>

                                    {/* CLEAR & NEAT HIGH-RESOLUTION QR CODE BOX */}
                                    <div className="p-2 bg-white border-2 border-slate-300 rounded-2xl shadow-lg flex items-center gap-3 w-full max-w-[280px]">
                                        <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center shadow-inner">
                                            <img 
                                                src={qrCodeImageUrl} 
                                                alt="Crisp High-Res QR Code" 
                                                className="w-full h-full object-contain"
                                                loading="eager"
                                            />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <span className="text-[9px] uppercase font-black tracking-wider text-blue-900 block flex items-center gap-1">
                                                <Scan className="w-3 h-3 text-blue-600" /> SCAN TO VIEW VISITOR
                                            </span>
                                            <span className="text-[8px] font-mono font-bold text-slate-700 block truncate mt-0.5">
                                                {activePassCode}
                                            </span>
                                            <span className="text-[7px] text-emerald-600 font-extrabold uppercase block mt-0.5">
                                                • Verified Digital Pass
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Accent Rim Ribbon */}
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-amber-400 to-indigo-700" />
                            </div>
                        </div>
                    </div>

                    {/* Print & Action Controls below badge */}
                    <div className="w-full max-w-sm mt-4 flex items-center gap-3 print:hidden">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{isAm ? 'ባጅ አትም' : 'Print Badge'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowScanModal(true)}
                            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Smartphone className="w-4 h-4" />
                            <span>Scan Result</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                INTERACTIVE MODAL: PREVIEW WHAT SCANNING THE QR CODE REVEALS
                ══════════════════════════════════════════════════════════════════ */}
            {showScanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden animate-fade-in">
                    <div className="bg-[#0b1222] border-2 border-indigo-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white relative">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setShowScanModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                                <Scan className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase text-white tracking-wide">
                                    {isAm ? 'የስካን ውጤት እይታ (Scanned Visitor Info)' : 'Scanned QR Code Visitor Information'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {isAm ? 'ሞባይል ስልኮች ባጁን ሲያነቡ የሚታየው ይፋዊ መረጃ' : 'This is exactly what opens when scanning the badge with any phone'}
                                </p>
                            </div>
                        </div>

                        {/* Scanned Visitor Details Snapshot */}
                        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/90 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-400 shrink-0 shadow flex items-center justify-center">
                                    {activePhoto ? (
                                        <img src={activePhoto} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-slate-800 text-indigo-200 flex items-center justify-center font-black text-xl">
                                            {activeFullName.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-base font-extrabold text-white truncate">{activeFullName}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            VERIFIED
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-300 font-semibold">{activeCompany}</p>
                                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">Code: {activePassCode}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-slate-800">
                                <div className="p-2.5 bg-slate-900 rounded-xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Arrival Timestamp</span>
                                    <span className="font-mono text-emerald-400 font-bold">{activeArrivalTime} ({activeArrivalDate})</span>
                                </div>
                                <div className="p-2.5 bg-slate-900 rounded-xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Host</span>
                                    <span className="text-white font-bold">{activeHost}</span>
                                </div>
                                <div className="p-2.5 bg-slate-900 rounded-xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                                    <span className="text-slate-200 font-medium">{activeDepartment}</span>
                                </div>
                                <div className="p-2.5 bg-slate-900 rounded-xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Clearance Level</span>
                                    <span className="text-amber-300 font-bold">{accessLevel}</span>
                                </div>
                                <div className="p-2.5 bg-slate-900 rounded-xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone Number</span>
                                    <span className="text-slate-200 font-mono">{activePhone}</span>
                                </div>
                                <div className="p-2.5 bg-slate-900 rounded-xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
                                    <span className="text-slate-200 font-mono truncate block">{activeEmail}</span>
                                </div>
                            </div>
                        </div>

                        {/* Direct Link Action */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                            <span className="text-xs text-slate-400 truncate font-mono text-[11px]">
                                {scanVerificationUrl}
                            </span>
                            <a
                                href={scanVerificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow cursor-pointer"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Page</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
