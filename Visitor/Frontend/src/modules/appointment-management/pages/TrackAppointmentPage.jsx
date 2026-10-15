import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, HelpCircle, X, Mail, Calendar, User, ExternalLink, Paperclip } from 'lucide-react';
import { appointmentsApi } from '../../../services/api';
import StatusBadge from '../../../components/StatusBadge';
import PublicNavbar from '../../../components/PublicNavbar';
import PublicFooter from '../../../components/PublicFooter';
import { getBackendBaseUrl } from '../../../utils/apiUrl';
const API_BASE = getBackendBaseUrl();
export default function TrackAppointmentPage() {
    const [params] = useSearchParams();
    const [reference, setReference] = useState(params.get('ref') || '');
    const [email, setEmail] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Recovery Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveredPasses, setRecoveredPasses] = useState([]);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const track = async () => {
        if (!reference)
            return;
        setLoading(true);
        setError('');
        try {
            const res = await appointmentsApi.track(reference, email || undefined);
            setData(res.data);
        }
        catch {
            setError('Appointment not found. Please verify your reference code.');
            setData(null);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (params.get('ref'))
            track();
    }, []);
    const handleRecoverySubmit = async (e) => {
        e.preventDefault();
        if (!recoveryEmail)
            return;
        setRecoveryLoading(true);
        setRecoveryMessage('');
        setRecoveredPasses([]);
        try {
            const res = await appointmentsApi.forgotReference(recoveryEmail);
            setRecoveryMessage(res.data.message);
            setRecoveredPasses(res.data.appointments);
        }
        catch (err) {
            setRecoveryMessage('Failed to retrieve reference codes. Please try again.');
        }
        finally {
            setRecoveryLoading(false);
        }
    };
    const handleSelectPass = (refCode) => {
        setReference(refCode);
        setIsModalOpen(false);
        setTimeout(() => {
            setLoading(true);
            setError('');
            appointmentsApi.track(refCode, email || undefined)
                .then((res) => setData(res.data))
                .catch(() => {
                setError('Appointment not found. Please verify your reference code.');
                setData(null);
            })
                .finally(() => setLoading(false));
        }, 100);
    };
    return (<div className="min-h-screen flex flex-col bg-[#070b13] text-slate-100 font-mono selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-900/5 blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none"/>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15 pointer-events-none"/>

      {/* Navigation */}
      <PublicNavbar />

      {/* Content Container */}
      <div className="flex-1 mx-auto max-w-2xl px-6 pt-28 pb-12 relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 shadow-lg shadow-brand-500/25 mb-4">
            <Building2 className="h-6 w-6 text-white"/>
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white uppercase">Track Pass</h1>
          <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest">Verify details and review workflow approvals in real-time</p>
        </div>

        {/* Tracking Input Card */}
        <div className="card mb-8">
          <div className="space-y-5">
            <div>
              <label className="label">Reference Code</label>
              <div className="flex gap-3">
                <input className="input font-mono uppercase tracking-widest placeholder:font-mono placeholder:tracking-widest" placeholder="VMS-ABC12345" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && track()}/>
                <button onClick={track} disabled={loading || !reference} className="btn-primary">
                  <Search className="h-4 w-4"/>
                  {loading ? 'Processing...' : 'Verify'}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Verification Email (Optional)</label>
              <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && track()}/>
            </div>

            {error && (<div className="rounded-lg border border-red-500/20 bg-red-950/25 p-4 text-xs text-red-400 font-semibold">
                &gt; {error}
              </div>)}

            <div className="pt-2 flex justify-center">
              <button onClick={() => { setIsModalOpen(true); setRecoveryMessage(''); setRecoveredPasses([]); setRecoveryEmail(''); }} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-400 hover:text-cyan-400 transition">
                <HelpCircle className="h-4.5 w-4.5"/>
                Forgot Reference Code?
              </button>
            </div>
          </div>
        </div>

        {/* Appointment Status Result */}
        <AnimatePresence>
          {data && (<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="card">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Appointment ID</span>
                  <h2 className="text-xl font-bold text-white tracking-widest mt-1 font-mono">{data.appointment.reference_code}</h2>
                </div>
                <StatusBadge status={data.appointment.status}/>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 text-xs">
                {[
                ['Visitor Full Name', data.appointment.visitor_name],
                ['Host Representative', data.appointment.host_name],
                ['Target Department', data.appointment.department_name],
                ['Meeting Schedule', new Date(data.appointment.scheduled_start).toLocaleString()],
                ['Purpose of Visit', data.appointment.purpose],
                ['Assigned Office / Room', data.appointment.room_name || 'Not assigned yet'],
            ].map(([k, v]) => (<div key={k} className="border-b border-slate-900 pb-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{k}</p>
                    <p className="font-bold text-slate-200 mt-1 text-sm">{v}</p>
                  </div>))}
              </div>

              {/* Approval workflow progress timeline */}
              {data.approvals?.length > 0 && (<div className="mt-8 border-t border-slate-900 pt-6">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Approval Sign-off Progress</h3>
                  <div className="space-y-3">
                    {data.approvals.map((a, i) => (<div key={i} className="flex items-center justify-between rounded-lg bg-slate-950/40 border border-slate-900 px-4 py-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#05080e] border border-slate-800 font-bold text-[10px] text-cyan-400 shadow-sm shadow-cyan-400/5">
                            {a.level}
                          </div>
                          <span className="font-bold text-slate-300">Level {a.level}: {a.approver_name}</span>
                        </div>
                        <StatusBadge status={a.decision}/>
                      </div>))}
                  </div>
                </div>)}

              {/* Attached documents */}
              {data.documents && data.documents.length > 0 && (<div className="mt-8 border-t border-slate-900 pt-6">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Attached Security Credentials</h3>
                  <div className="space-y-3">
                    {data.documents.map((doc) => (<div key={doc.id} className="flex items-center justify-between rounded-lg bg-slate-950/40 border border-slate-900 px-4 py-3 text-xs">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4.5 w-4.5 text-cyan-400"/>
                          <span className="font-bold text-slate-300">{doc.file_name}</span>
                        </div>
                        <a href={`${API_BASE}${doc.file_url}`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider text-[10px]">
                          View Pass
                        </a>
                      </div>))}
                  </div>
                </div>)}
            </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Recovery Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0b101b] p-6 shadow-2xl overflow-hidden">
              {/* Top border indicator */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400"/>
              
              <div className="flex items-center justify-between mb-6 pt-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-cyan-400"/> Pass recovery
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white transition duration-200">
                  <X className="h-5 w-5"/>
                </button>
              </div>

              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Enter the email address registered during booking to recover active reference codes.
                </p>

                <div className="flex gap-2">
                  <input type="email" required className="input flex-1" placeholder="john.smith@email.com" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}/>
                  <button type="submit" disabled={recoveryLoading} className="btn-primary px-6">
                    {recoveryLoading ? 'Searching...' : 'Recover'}
                  </button>
                </div>
              </form>

              {/* Recovery results list */}
              {recoveryMessage && (<div className="mt-6 border-t border-slate-900 pt-4">
                  <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">&gt; {recoveryMessage}</p>
                  
                  {recoveredPasses.length > 0 ? (<div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {recoveredPasses.map((pass) => (<div key={pass.id} onClick={() => handleSelectPass(pass.referenceCode)} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-900 bg-slate-950/40 p-3 hover:border-cyan-400/50 hover:bg-slate-950/80 cursor-pointer transition duration-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white group-hover:text-cyan-400 transition tracking-wider">
                                {pass.referenceCode}
                              </span>
                              <StatusBadge status={pass.status}/>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-slate-700"/> Host: {pass.hostName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-700"/> Date: {new Date(pass.scheduledStart).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300 transition mt-2 sm:mt-0 flex items-center gap-0.5 self-end sm:self-auto">
                            Auto Fill <ExternalLink className="h-3 w-3"/>
                          </span>
                        </div>))}
                    </div>) : (recoveryEmail && !recoveryLoading && (<p className="text-[10px] text-slate-600 italic mt-1 font-mono">
                        Try using 'john.smith@email.com' to view demo appointments.
                      </p>))}
                </div>)}
            </motion.div>
          </div>)}
      </AnimatePresence>
      <PublicFooter />
    </div>);
}
