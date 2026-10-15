import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Building, Phone, Mail, ArrowLeft, Printer, BadgeCheck, Loader2, AlertCircle, Building2, UserCheck } from 'lucide-react';
import PublicNavbar from '../../../components/PublicNavbar';
import PublicFooter from '../../../components/PublicFooter';
import { resolvePhotoUrl } from '../../../utils/photoUtils';
import { getBackendBaseUrl } from '../../../utils/apiUrl';
export default function VerifyVisitorPassPage() {
    const [params] = useSearchParams();
    const visitorCode = params.get('code') || params.get('ref') || 'VIS-2026-00009';
    const [loading, setLoading] = useState(true);
    const [visitor, setVisitor] = useState(null);
    useEffect(() => {
        setLoading(true);
        // Fetch profile data from API or load formatted verification payload
        const backendBase = getBackendBaseUrl();
        fetch(`${backendBase}/api/appointments/track?code=${encodeURIComponent(visitorCode)}`)
            .then((res) => {
            if (!res.ok)
                throw new Error('Not found');
            return res.json();
        })
            .then((data) => {
            const appt = data?.appointment || data;
            if (appt && (appt.visitor_name || appt.reference_code || appt.id)) {
                setVisitor({
                    fullName: appt.visitor_name || appt.fullName || 'Visitor',
                    code: appt.visitor_code || visitorCode,
                    refNo: appt.reference_code || appt.reference_number || 'REF-N/A',
                    company: appt.company || appt.organization || 'General',
                    department: appt.department_name || 'General',
                    phone: appt.visitor_phone || appt.phone || '—',
                    email: appt.visitor_email || appt.email || '—',
                    hostName: appt.host_name || appt.hostEmployee || 'Staff Host',
                    category: appt.category || 'Standard',
                    accessLevel: appt.access_level || 'STANDARD',
                    status: appt.status || 'ACTIVE',
                    photoUrl: appt.photo_url || null,
                    registrationDate: appt.created_at || new Date().toISOString()
                });
            }
            else {
                setVisitor(null);
            }
        })
            .catch(() => {
            setVisitor(null);
        })
            .finally(() => setLoading(false));
    }, [visitorCode]);
    return (<div className="min-h-screen flex flex-col bg-[#070b13] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"/>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none"/>

      {/* Navigation Bar */}
      <PublicNavbar />

      <div className="flex-1 mx-auto max-w-xl px-4 pt-24 pb-16 relative z-10 w-full">
        {/* Top Back Navigation Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/track" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-all shadow-md active:scale-95">
            <ArrowLeft size={16}/>
            Back to Directory
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={14}/> Official Verified Pass
          </span>
        </div>

        {loading ? (<div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
            <Loader2 className="animate-spin text-indigo-400 mb-3" size={40}/>
            <p className="text-xs font-semibold tracking-wider">Verifying Digital Pass Credentials...</p>
          </div>) : visitor ? (<motion.div initial={{ opacity: 0, y: 25, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-6">
            {/* ATTRACTIVE DIGITAL VISITOR BADGE CARD */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/90 p-8 shadow-2xl space-y-6 text-white backdrop-blur-xl">
              
              {/* Header Badge Strip */}
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={22} className="text-emerald-400"/>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300">Enterprise Digital Pass</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Visitor Security System</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider">
                  {visitor.status}
                </span>
              </div>

              {/* Avatar & Visitor Name Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left bg-slate-950/70 p-5 rounded-2xl border border-slate-800/90 shadow-inner">
                {/* Photo Frame */}
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-400 shadow-xl flex items-center justify-center">
                    {(visitor.photoUrl || visitor.photo_url || visitor.visitor_photo) ? (<img src={resolvePhotoUrl(visitor.photoUrl || visitor.photo_url || visitor.visitor_photo)} alt={visitor.fullName} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-900 to-slate-800 text-indigo-200">
                        <span className="text-3xl font-black uppercase">
                          {visitor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'VP'}
                        </span>
                      </div>)}
                  </div>
                  <span className="absolute -bottom-2 -right-2 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg border-2 border-slate-950">
                    <ShieldCheck size={14}/>
                  </span>
                </div>

                {/* Identity Details */}
                <div className="space-y-1.5 flex-1">
                  <h1 className="text-xl font-bold text-white leading-tight capitalize">
                    {visitor.fullName}
                  </h1>
                  <p className="text-xs font-semibold text-indigo-300 flex items-center justify-center sm:justify-start gap-1.5">
                    <Building size={14} className="text-indigo-400"/> {visitor.company}
                  </p>
                  
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono">
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg text-indigo-300 border border-slate-800">
                      ID: <strong>{visitor.code}</strong>
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-800">
                      Ref: <strong>{visitor.refNo}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-800/90">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-indigo-400"/> Department
                  </span>
                  <span className="font-bold text-white text-sm block">{visitor.department}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <UserCheck size={13} className="text-blue-400"/> Host Employee
                  </span>
                  <span className="font-bold text-blue-400 text-sm block">{visitor.hostName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-400"/> Phone Number
                  </span>
                  <span className="font-bold text-slate-200 text-sm block">{visitor.phone}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Mail size={13} className="text-purple-400"/> Email Address
                  </span>
                  <span className="font-bold text-slate-200 text-sm block truncate">{visitor.email}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <BadgeCheck size={13} className="text-amber-400"/> Category
                  </span>
                  <span className="font-bold text-purple-300 text-sm block">{visitor.category}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400"/> Access Level
                  </span>
                  <span className="font-bold text-emerald-400 text-sm block">{visitor.accessLevel}</span>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="text-emerald-400" size={16}/>
                  <span>Verified Identity Record</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all">
                    <Printer size={14}/> Print Card
                  </button>
                </div>
              </div>
            </div>
          </motion.div>) : (<div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-3">
            <AlertCircle className="mx-auto text-amber-400" size={40}/>
            <h3 className="text-base font-bold text-white">Visitor Pass Not Found</h3>
            <p className="text-xs text-slate-400">The scanned visitor code is invalid or expired.</p>
          </div>)}
      </div>

      <PublicFooter />
    </div>);
}
