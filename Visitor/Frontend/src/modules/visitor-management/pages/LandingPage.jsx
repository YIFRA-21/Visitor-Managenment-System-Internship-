import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, ArrowRight, Building2, Users, CheckCircle, Sparkles, Download, Bell, FileText, AlertCircle, ChevronDown, UserCheck, QrCode, Laptop, Check, RefreshCw, Info, BookOpen } from 'lucide-react';
import PublicNavbar from '../../../components/PublicNavbar';
import PublicFooter from '../../../components/PublicFooter';
// Predefined FAQs
const faqs = [
    {
        q: 'How do visitors receive their digital passes?',
        a: 'Once an appointment is booked and approved by the host, the visitor receives an email containing a secure QR code and a reference number. This pass can be saved to their mobile device or printed for seamless check-in.'
    },
    {
        q: 'Can hosts manage appointments on their own?',
        a: 'Yes. Hosts receive instant email notifications of pending appointments and can approve, reschedule, or reject them directly from their personal dashboard.'
    },
    {
        q: 'Does it support instant notifications for walk-in arrivals?',
        a: 'Absolutely. When a visitor checks in at the reception desk, the system automatically sends an SMS and email notification to the host, alerting them that their guest has arrived.'
    },
    {
        q: 'Is visitor data secure and compliant?',
        a: 'Yes, data privacy is our priority. The platform supports automated data retention policies, detailed audit logs, and secure database encryption to comply with GDPR, SOC2, and local workplace privacy regulations.'
    }
];
// Mock activity feed data for the dashboard tab
const mockActivityPool = [
    { name: 'Sarah Connor', host: 'John Connor', dept: 'Engineering', status: 'Checked In', time: 'Just now' },
    { name: 'Bruce Wayne', host: 'Lucius Fox', dept: 'Executive Office', status: 'Approved', time: '2 mins ago' },
    { name: 'Tony Stark', host: 'Pepper Potts', dept: 'Research', status: 'Checked In', time: '5 mins ago' },
    { name: 'Peter Parker', host: 'Dr. Connors', dept: 'Bio Lab', status: 'Checked Out', time: '10 mins ago' },
    { name: 'Diana Prince', host: 'Steve Trevor', dept: 'Security', status: 'Awaiting Approval', time: '15 mins ago' },
];
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
export default function LandingPage() {
    const { language, t } = useLanguage();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    // Simulator state
    const [activeTab, setActiveTab] = useState('pass');
    // Pass Generator state
    const [visitorName, setVisitorName] = useState('Jane Doe');
    const [hostName, setHostName] = useState('Alex Carter');
    const [department, setDepartment] = useState('Engineering');
    const [purpose, setPurpose] = useState('Technical Interview');
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloaded, setDownloaded] = useState(false);
    // Dashboard state
    const [activities, setActivities] = useState(mockActivityPool.slice(0, 3));
    const [activeVisitorCount, setActiveVisitorCount] = useState(12);
    // Reception state
    const [receptionQueue, setReceptionQueue] = useState([
        { id: '1', name: 'Robert Downey', host: 'Jon Favreau', status: 'Awaiting Host', notified: false },
        { id: '2', name: 'Natasha Romanoff', host: 'Nick Fury', status: 'Checked In', notified: true },
        { id: '3', name: 'Steve Rogers', host: 'Bucky Barnes', status: 'Awaiting Host', notified: false }
    ]);
    const [notifiedUser, setNotifiedUser] = useState(null);
    // FAQ state
    const [openFaq, setOpenFaq] = useState(null);
    // Hash scroll observer
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash) {
                const id = window.location.hash.substring(1);
                setTimeout(() => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 150);
            }
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    // Contact state
    const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const handleContactSubmit = (e) => {
        e.preventDefault();
        if (!contactForm.name || !contactForm.email || !contactForm.message)
            return;
        setContactSubmitting(true);
        setTimeout(() => {
            setContactSubmitting(false);
            setContactSubmitted(true);
            setContactForm({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setContactSubmitted(false), 4000);
        }, 1500);
    };
    // Dynamic dashboard feed updates
    useEffect(() => {
        if (activeTab !== 'dashboard')
            return;
        const interval = setInterval(() => {
            // Append new random visitor activity
            const randomActivity = mockActivityPool[Math.floor(Math.random() * mockActivityPool.length)];
            const updatedActivity = {
                ...randomActivity,
                time: 'Just now'
            };
            setActivities(prev => [updatedActivity, ...prev.slice(0, 2)]);
            setActiveVisitorCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 4000);
        return () => clearInterval(interval);
    }, [activeTab]);
    // Simulate Pass Download
    const handleDownloadPass = () => {
        if (downloading || downloaded)
            return;
        setDownloading(true);
        setDownloadProgress(0);
        const interval = setInterval(() => {
            setDownloadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setDownloading(false);
                    setDownloaded(true);
                    setTimeout(() => setDownloaded(false), 3000);
                    return 100;
                }
                return prev + 10;
            });
        }, 100);
    };
    // Simulate Reception Alert
    const triggerReceptionAlert = (id, name) => {
        setReceptionQueue(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, notified: true, status: 'Host Notified' };
            }
            return item;
        }));
        setNotifiedUser(name);
        setTimeout(() => setNotifiedUser(null), 3500);
    };
    return (<div className={`relative min-h-screen flex flex-col overflow-hidden ${isDark ? 'bg-[#060910] text-white' : 'bg-[#fafbfc] text-slate-900'} font-sans selection:bg-brand-500 selection:text-white`}>
      
      {/* Dynamic Mesh Backgrounds */}
      <div className={`absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[120px] pointer-events-none ${isDark ? 'bg-indigo-900/10' : 'bg-indigo-500/5'}`}/>
      <div className={`absolute top-[30%] right-[-10%] h-[700px] w-[700px] rounded-full blur-[150px] pointer-events-none ${isDark ? 'bg-cyan-900/10' : 'bg-cyan-500/5'}`}/>
      <div className={`absolute bottom-[0%] left-[20%] h-[600px] w-[600px] rounded-full blur-[120px] pointer-events-none ${isDark ? 'bg-brand-900/10' : 'bg-brand-500/5'}`}/>
      
      {/* High-tech Grid Overlay */}
      <div className={`absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none ${isDark
            ? 'bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)]'}`}/>

      {/* Glassmorphic Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <section id="home" className="flex-1 relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-28 text-center lg:pt-36">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="mx-auto max-w-4xl">
          {/* Pulsing Badge */}
          <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-md shadow-md ${isDark
            ? 'border-brand-500/30 bg-brand-950/40 text-brand-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
            : 'border-brand-500/25 bg-brand-500/5 text-brand-700 shadow-[0_0_15px_rgba(99,102,241,0.05)]'}`}>
            <Sparkles className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse"/>
            {language === 'en' ? 'Empowering Modern Workplaces' : 'ዘመናዊ የስራ ቦታዎችን ማጎልበት'}
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight md:text-7xl leading-tight md:leading-[1.12]">
            {language === 'en' ? 'The Digital Front Desk of' : 'የነገው ዲጂታል መስተንግዶ'}{' '}
            <span className="relative block sm:inline">
              <span className={`bg-gradient-to-r ${isDark
            ? 'from-brand-400 via-cyan-300 to-indigo-400'
            : 'from-brand-600 via-cyan-600 to-indigo-600'} bg-clip-text text-transparent`}>
                {language === 'en' ? 'Tomorrow' : 'ዴስክ'}
              </span>
              <span className={`absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r ${isDark
            ? 'from-brand-500/30 via-cyan-400/50 to-indigo-500/30 blur-[1px]'
            : 'from-brand-500/20 via-cyan-500/30 to-indigo-500/20'} rounded-full`}/>
            </span>
          </h1>
          
          <p className={`mx-auto mt-8 max-w-2xl text-base md:text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
            {t('hero.subtitle')}
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/20 hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              {t('hero.bookBtn')}
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"/>
              <span className="absolute inset-0 bg-gradient-to-r from-brand-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"/>
            </Link>
            <Link to="/track" className={`inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-bold backdrop-blur-md transition-all duration-200 active:scale-[0.98] ${isDark
            ? 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20'
            : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-300'}`}>
              {t('hero.trackBtn')}
            </Link>
          </div>
        </motion.div>

        {/* Floating elements animation container */}
        <div className="relative mt-16 max-w-5xl mx-auto pointer-events-none select-none">
          <div className="absolute top-[20%] -left-10 md:left-2 bg-slate-900/80 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-bounce" style={{ animationDuration: '6s' }}>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="h-4.5 w-4.5"/>
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-slate-200">Visitor Checked In</p>
              <p className="text-slate-400">Alice Smith (Host: John Doe)</p>
            </div>
          </div>

          <div className="absolute bottom-[10%] -right-8 md:right-4 bg-slate-900/80 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-bounce" style={{ animationDuration: '8s', animationDelay: '1.5s' }}>
            <div className="h-8 w-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
              <Bell className="h-4.5 w-4.5"/>
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-slate-200">SMS Sent to Host</p>
              <p className="text-slate-400">Guest arrived at Reception</p>
            </div>
          </div>
        </div>

        {/* =======================================
            THE LIVE VMS SIMULATOR HUB (Interactive)
            ======================================= */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-12 md:mt-24 max-w-5xl mx-auto rounded-2xl border border-slate-800/80 bg-[#0b101b]/70 p-4 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Top Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400"/>
          
          <div className="text-center md:text-left mb-8 pt-4">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Try It in Real-Time
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-2">
              Experience the core workflows of our Visitor Management system with this live interactive simulator.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-950/60 border border-white/5 rounded-2xl mb-8">
            {[
            { id: 'pass', label: '1. Digital Pass Generator', icon: QrCode },
            { id: 'dashboard', label: '2. Live Admin Dashboard', icon: Laptop },
            { id: 'reception', label: '3. Reception Desk Feed', icon: Users }
        ].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-lg shadow-brand-600/15'
                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <tab.icon className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`}/>
                {tab.label}
              </button>))}
          </div>

          {/* Toast Notification for Reception alert */}
          <AnimatePresence>
            {notifiedUser && (<motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 rounded-2xl shadow-xl border border-emerald-400/20 text-white text-sm font-semibold backdrop-blur-md">
                <Bell className="h-5 w-5 animate-bounce"/>
                <span>Simulated SMS Sent to host for {notifiedUser}!</span>
              </motion.div>)}
          </AnimatePresence>

          {/* Tab Contents */}
          <div className="min-h-[450px]">
            <AnimatePresence mode="wait">
              {/* TAB 1: PASS GENERATOR */}
              {activeTab === 'pass' && (<motion.div key="pass-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }} className="grid md:grid-cols-2 gap-8 items-stretch text-left">
                  {/* Left: Input fields */}
                  <div className="flex flex-col justify-between space-y-6 bg-slate-950/40 border border-white/5 p-6 rounded-2xl">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-brand-400"/>
                        Customize Visitor Pass
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Fill in details below to instantly view your dynamic smart pass.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Visitor Full Name</label>
                        <input type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Visitor Name" maxLength={24} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"/>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Host / Sponsor</label>
                        <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Host Name" maxLength={24} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"/>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-all duration-200">
                            <option>Engineering</option>
                            <option>HR & Talent</option>
                            <option>Finance</option>
                            <option>Executive Office</option>
                            <option>Operations</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Purpose of Visit</label>
                          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-all duration-200">
                            <option>Technical Interview</option>
                            <option>Client Meeting</option>
                            <option>Delivery / Courier</option>
                            <option>Facility Maintenance</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button onClick={handleDownloadPass} disabled={downloading} className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 hover:bg-white/15 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-50">
                      {downloading ? (<div className="flex items-center gap-2">
                          <RefreshCw className="h-4.5 w-4.5 animate-spin text-brand-400"/>
                          <span>Generating File ({downloadProgress}%)</span>
                        </div>) : downloaded ? (<div className="flex items-center gap-2 text-emerald-400">
                          <Check className="h-4.5 w-4.5 animate-scale"/>
                          <span>Downloaded Successfully!</span>
                        </div>) : (<>
                          <Download className="h-4.5 w-4.5"/>
                          <span>Download Simulated Pass</span>
                        </>)}
                      
                      {/* Download Simulated Progress bar background */}
                      {downloading && (<div className="absolute bottom-0 left-0 h-1 bg-brand-500 transition-all duration-100" style={{ width: `${downloadProgress}%` }}/>)}
                    </button>
                  </div>

                  {/* Right: Glassmorphic Badge Render */}
                  <div className="flex items-center justify-center bg-gradient-to-tr from-slate-950 to-slate-900 border border-white/10 p-6 md:p-10 rounded-2xl relative overflow-hidden shadow-2xl">
                    {/* Futuristic Badge Wrapper */}
                    <div className="relative w-full max-w-[320px] bg-slate-900/90 border border-white/15 rounded-3xl p-6 shadow-3xl overflow-hidden backdrop-blur-2xl">
                      {/* Laser scanning line effect */}
                      <motion.div animate={{ y: [0, 360, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 pointer-events-none z-10 shadow-[0_0_10px_rgba(34,211,238,0.5)]"/>

                      {/* Accent highlight */}
                      <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none"/>
                      
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-brand-400"/>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Visitor Pass</span>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"/>
                      </div>

                      {/* Mock QR Code in center */}
                      <div className="flex justify-center my-6">
                        <div className="p-3 bg-white rounded-2xl relative shadow-md group">
                          {/* Inner custom SVG QR code representation */}
                          <svg width="120" height="120" viewBox="0 0 100 100" className="text-slate-950">
                            <rect x="0" y="0" width="20" height="20" fill="currentColor"/>
                            <rect x="5" y="5" width="10" height="10" fill="white"/>
                            <rect x="80" y="0" width="20" height="20" fill="currentColor"/>
                            <rect x="85" y="5" width="10" height="10" fill="white"/>
                            <rect x="0" y="80" width="20" height="20" fill="currentColor"/>
                            <rect x="5" y="85" width="10" height="10" fill="white"/>
                            
                            {/* Random filler blocks representation */}
                            <rect x="30" y="10" width="10" height="10" fill="currentColor"/>
                            <rect x="50" y="0" width="20" height="10" fill="currentColor"/>
                            <rect x="30" y="30" width="20" height="20" fill="currentColor"/>
                            <rect x="10" y="40" width="10" height="20" fill="currentColor"/>
                            <rect x="60" y="30" width="10" height="40" fill="currentColor"/>
                            <rect x="80" y="30" width="20" height="10" fill="currentColor"/>
                            <rect x="80" y="50" width="10" height="20" fill="currentColor"/>
                            <rect x="30" y="60" width="25" height="15" fill="currentColor"/>
                            <rect x="10" y="70" width="10" height="5" fill="currentColor"/>
                            <rect x="70" y="80" width="15" height="15" fill="currentColor"/>
                          </svg>
                          {/* Floating logo inside QR code */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 p-1 rounded-lg border border-white/10">
                            <Building2 className="h-4 w-4 text-cyan-400"/>
                          </div>
                        </div>
                      </div>

                      {/* Visitor Details */}
                      <div className="space-y-3 text-xs border-t border-white/5 pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Visitor</p>
                            <p className="font-bold text-white text-sm truncate">{visitorName || 'Jane Doe'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Host</p>
                            <p className="font-semibold text-slate-200 truncate">{hostName || 'Alex Carter'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Department</p>
                            <p className="font-semibold text-slate-300 truncate">{department}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Purpose</p>
                            <p className="font-semibold text-slate-300 truncate">{purpose}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-mono">REF: VMS-94021</span>
                          <span>EXP: End of Day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>)}

              {/* TAB 2: DASHBOARD PREVIEW */}
              {activeTab === 'dashboard' && (<motion.div key="dashboard-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }} className="grid md:grid-cols-2 gap-8 items-stretch text-left">
                  {/* Left: Key Metrics & Chart preview */}
                  <div className="flex flex-col justify-between space-y-6 bg-slate-950/40 border border-white/5 p-6 rounded-2xl">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Laptop className="h-5 w-5 text-indigo-400"/>
                          Real-Time Dashboard Preview
                        </h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-300 border border-indigo-400/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"/>
                          Live Simulated Feed
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Watch metrics evolve as the system logs visitors in real-time.
                      </p>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-950 border border-white/5 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Active Now</p>
                        <p className="text-lg font-extrabold text-white mt-1">{activeVisitorCount}</p>
                      </div>
                      <div className="bg-slate-950 border border-white/5 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Avg. Duration</p>
                        <p className="text-lg font-extrabold text-white mt-1">42m</p>
                      </div>
                      <div className="bg-slate-950 border border-white/5 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Today</p>
                        <p className="text-lg font-extrabold text-white mt-1">118</p>
                      </div>
                    </div>

                    {/* Custom animated SVG Chart */}
                    <div className="bg-slate-950 border border-white/5 p-4 rounded-xl relative overflow-hidden h-[180px]">
                      <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 uppercase">Hourly Visitors Volume</div>
                      
                      <div className="absolute inset-0 flex items-end px-2 pb-2 pt-8">
                        <svg className="w-full h-full text-brand-500" viewBox="0 0 300 100" preserveAspectRatio="none">
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>
                          
                          {/* Animated Area path */}
                          <path d="M0,100 L30,80 L60,85 L90,60 L120,40 L150,70 L180,30 L210,45 L240,15 L270,30 L300,10 L300,100 Z" fill="url(#chart-glow)"/>
                          {/* Wave line */}
                          <motion.path d="M0,100 L30,80 L60,85 L90,60 L120,40 L150,70 L180,30 L210,45 L240,15 L270,30 L300,10" fill="none" stroke="currentColor" strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}/>
                          
                          {/* Horizontal Grid lines */}
                          <line x1="0" y1="20" x2="300" y2="20" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="4"/>
                          <line x1="0" y1="50" x2="300" y2="50" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="4"/>
                          <line x1="0" y1="80" x2="300" y2="80" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="4"/>
                        </svg>
                      </div>
                      
                      {/* Custom points overlay */}
                      <div className="absolute bottom-24 right-4 flex items-center gap-1.5 bg-slate-900/90 border border-brand-500/20 px-2 py-1 rounded text-[10px] text-white font-mono shadow-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400"/>
                        Peak: 12:00 PM
                      </div>
                    </div>
                  </div>

                  {/* Right: Live dynamic Feed logs */}
                  <div className="bg-gradient-to-tr from-slate-950 to-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"/>
                        Live Security & Event Log
                      </h3>
                      <div className="space-y-3 min-h-[260px]">
                        <AnimatePresence initial={false}>
                          {activities.map((act, index) => (<motion.div key={act.name + index} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0, x: 20, height: 0 }} transition={{ duration: 0.35 }} className="bg-slate-900/80 border border-white/5 p-4 rounded-xl flex items-start justify-between text-xs hover:border-white/10 transition-all duration-200">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{act.name}</span>
                                  <span className="text-slate-500">&rarr;</span>
                                  <span className="text-slate-300">{act.host}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <span>{act.dept}</span>
                                  <span>&bull;</span>
                                  <span className="italic">{act.time}</span>
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${act.status === 'Checked In'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : act.status === 'Checked Out'
                        ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        : act.status === 'Approved'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {act.status}
                              </span>
                            </motion.div>))}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-[10px] text-slate-500 flex items-center justify-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin text-indigo-400"/>
                        Simulating new visitor activity every 4 seconds
                      </p>
                    </div>
                  </div>
                </motion.div>)}

              {/* TAB 3: RECEPTION FEED */}
              {activeTab === 'reception' && (<motion.div key="reception-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }} className="grid md:grid-cols-2 gap-8 items-stretch text-left">
                  {/* Left: Queue management explanation */}
                  <div className="flex flex-col justify-between space-y-6 bg-slate-950/40 border border-white/5 p-6 rounded-2xl">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-400"/>
                        Reception Desk Queue
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Receptionists manage visitors as they arrive on-premise.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs text-slate-300">
                      <div className="flex items-start gap-3 bg-slate-950 p-4.5 rounded-xl border border-white/5">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mt-0.5 font-bold">1</div>
                        <div>
                          <p className="font-bold text-white">Match Pre-booked Visitors</p>
                          <p className="text-slate-400 mt-0.5">Quickly find scheduled visitors in the dynamic local registry upon arrival.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-950 p-4.5 rounded-xl border border-white/5">
                        <div className="h-6 w-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 mt-0.5 font-bold">2</div>
                        <div>
                          <p className="font-bold text-white">Alert Host with SMS & Email</p>
                          <p className="text-slate-400 mt-0.5">Click "Send SMS Alert" on the right. This instantly sends a simulated SMS notification to the host.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-xs text-emerald-300 items-start">
                      <AlertCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5"/>
                      <p>
                        Hosts can instantly respond to SMS alerts to let reception know they are on their way.
                      </p>
                    </div>
                  </div>

                  {/* Right: Active list with action triggers */}
                  <div className="bg-gradient-to-tr from-slate-950 to-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                        Today's Arrival Queue
                      </h3>
                      
                      <div className="space-y-3">
                        {receptionQueue.map((item) => (<div key={item.id} className="bg-slate-900/70 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-white text-xs">{item.name}</p>
                              <p className="text-[11px] text-slate-400">Host: <span className="text-slate-300">{item.host}</span></p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${item.status === 'Checked In'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/10'}`}>
                                {item.status}
                              </span>

                              <button onClick={() => triggerReceptionAlert(item.id, item.name)} disabled={item.notified} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 flex items-center gap-1.5 ${item.notified
                    ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/10 active:scale-95'}`}>
                                {item.notified ? (<>
                                    <Check className="h-3 w-3"/>
                                    <span>Notified</span>
                                  </>) : (<>
                                    <Bell className="h-3 w-3"/>
                                    <span>Send SMS</span>
                                  </>)}
                              </button>
                            </div>
                          </div>))}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 text-center mt-6">
                      Interact with "Send SMS" to simulate visitor arrival triggers
                    </p>
                  </div>
                </motion.div>)}
            </AnimatePresence>
          </div>
        </motion.div>



        {/* =======================================
            SCROLL-ANIMATED WORKFLOW TIMELINE
            ======================================= */}
        <div className="mt-28 md:mt-40 max-w-5xl mx-auto relative px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              How It Works
            </h2>
            <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl mx-auto">
              Four simple, fully automated steps to handle any visitor from registration to exit.
            </p>
          </div>

          {/* Timeline Process Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
            { step: '01', title: 'Pre-Register', desc: 'Host or visitor enters details online using the secure smart booking wizard.' },
            { step: '02', title: 'Instant Approval', desc: 'Host receives alert and approves appointment with a single click from their device.' },
            { step: '03', title: 'Seamless Check-In', desc: 'Visitor arrives, scans their personal QR code pass at reception, or checks in directly.' },
            { step: '04', title: 'Host Alerted', desc: 'System automatically dispatches SMS and email notifications to the host upon check-in.' }
        ].map((item, index) => (<div key={index} className="group relative rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md hover:border-white/10 hover:bg-slate-900/60 transition-all duration-300">
                <div className="absolute top-4 right-6 text-3xl font-extrabold text-white/5 group-hover:text-brand-500/10 transition-colors duration-300 font-mono">
                  {item.step}
                </div>
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 font-extrabold text-sm mb-4">
                  {index + 1}
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{item.desc}</p>
              </div>))}
          </div>
        </div>



        {/* Stats Metrics Overhaul */}
        <div className="mt-28 md:mt-40 rounded-3xl border border-white/5 bg-slate-900/30 p-8 md:p-12 backdrop-blur-md shadow-2xl">
          <div className="grid items-center gap-10 md:grid-cols-3">
            {[
            { icon: Users, value: '15,000+', label: 'Checked-in Visitors', color: 'text-brand-400' },
            { icon: CheckCircle, value: '99.99%', label: 'Active Service Uptime', color: 'text-cyan-400' },
            { icon: Shield, value: 'SOC2 / GDPR', label: 'Security Compliance', color: 'text-indigo-400' },
        ].map((stat, i) => (<div key={i} className="text-center group">
                <stat.icon className={`mx-auto mb-4 h-9 w-9 ${stat.color} transition duration-300 group-hover:scale-110`}/>
                <p className="text-4xl font-extrabold text-white tracking-tight">{stat.value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
              </div>))}
          </div>
        </div>

        {/* =======================================
            INTERACTIVE FAQ ACCORDION
            ======================================= */}
        <div id="faq" className="mt-28 md:mt-40 max-w-3xl mx-auto px-4 scroll-mt-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm md:text-base">
              Got questions? We have answers. Discover how our digital registry secures and expedites front desk operations.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (<div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isDark
                    ? 'bg-slate-900/40 border-white/5 hover:border-white/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}`}>
                  <button onClick={() => setOpenFaq(isOpen ? null : idx)} className="w-full flex items-center justify-between gap-4 p-6 text-left focus:outline-none">
                    <span className={`font-bold text-sm md:text-base ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-brand-400' : ''}`}/>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
                        <div className={`px-6 pb-6 text-xs md:text-sm leading-relaxed border-t pt-4 ${isDark
                        ? 'text-slate-400 border-white/5 bg-slate-950/20'
                        : 'text-slate-600 border-slate-100 bg-slate-50/50'}`}>
                          {faq.a}
                        </div>
                      </motion.div>)}
                  </AnimatePresence>
                </div>);
        })}
          </div>
        </div>

        {/* =======================================
            ABOUT THE PLATFORM SECTION
            ======================================= */}
        <div id="about" className="mt-28 md:mt-40 max-w-5xl mx-auto px-4 scroll-mt-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6 text-left">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-950/20 px-3 py-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                <Info className="h-3.5 w-3.5 text-cyan-400"/>
                ABOUT THE PLATFORM
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Securing the Physical Office with <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">Digital Precision</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                VisitorMS bridges the gap between digital convenience and strict physical workplace security. Born from the need to eliminate outdated, unsecured paper logbooks, our solution offers a seamless flow for guests, hosts, security officers, and reception desks.
              </p>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                We believe that a visitor's first impression of your office begins at the entrance lobby. By combining lightning-fast digital check-ins with automated background checks, real-time SMS alerts, and encrypted log archiving, we keep operations smooth and facilities safe.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 card !p-4 border-l-4 border-l-cyan-400 bg-bg-card/70">
                  <div className="h-10 w-10 rounded-xl bg-bg-secondary border border-border-color flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,245,255,0.15)] shrink-0">
                    <Shield className="h-5 w-5"/>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Secure Storage</h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">Encrypted visitor logs</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3 card !p-4 border-l-4 border-l-purple-400 bg-bg-card/70">
                  <div className="h-10 w-10 rounded-xl bg-bg-secondary border border-border-color flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(127,119,221,0.15)] shrink-0">
                    <BookOpen className="h-5 w-5"/>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Compliance ready</h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">SOC2 & GDPR structured</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Graphic Card Matrix */}
            <div className="grid grid-cols-2 gap-4">
              {[
            { title: 'Pre-Validation', desc: 'Secure pre-booking via host invitations ensures only validated visitors enter.', icon: Clock, color: 'text-cyan-400 hover:border-cyan-400/40 shadow-cyan-400/5' },
            { title: 'Dynamic QR Passes', desc: 'QR codes generated instantly upon host approval. Single-use prevents pass sharing.', icon: QrCode, color: 'text-purple-400 hover:border-purple-400/40 shadow-purple-400/5' },
            { title: 'Blacklist Checks', desc: 'Real-time background queries alert reception of security anomalies immediately.', icon: Shield, color: 'text-rose-400 hover:border-rose-400/40 shadow-rose-400/5' },
            { title: 'Host Live-Sync', desc: 'System automatically dispatches SMS notifications the moment guests arrive.', icon: Bell, color: 'text-emerald-400 hover:border-emerald-400/40 shadow-emerald-400/5' }
        ].map((item, idx) => (<div key={idx} className={`card p-5 text-left flex flex-col justify-between hover:scale-[1.02] transition duration-300 shadow-md ${item.color}`}>
                  <item.icon className="h-6 w-6 mb-4 shrink-0"/>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans">{item.desc}</p>
                  </div>
                </div>))}
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <PublicFooter />
    </div>);
}
