import { useState, useEffect } from 'react';
import RefreshButton from '../../components/common/RefreshButton';
import { HelpCircle, Send, ShieldAlert, LifeBuoy, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Search, MessageSquare, PhoneCall, Mail } from 'lucide-react';
import { visitorPortalApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorSupport() {
    const { t } = useLanguage();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Form State
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('SUPPORT');
    const [description, setDescription] = useState('');
    // Expand States
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const [expandedFaqId, setExpandedFaqId] = useState(0); // First FAQ open by default
    // FAQ Search & Category Filter State
    const [faqSearch, setFaqSearch] = useState('');
    const [activeFaqCategory, setActiveFaqCategory] = useState('ALL');
    const loadTickets = async (showSpinner = false) => {
        if (showSpinner)
            setRefreshing(true);
        else
            setLoading(true);
        try {
            const res = await visitorPortalApi.getSupportTickets();
            if (res.data && Array.isArray(res.data)) {
                setTickets(res.data);
            }
        }
        catch (err) {
            console.warn('Fallback support tickets:', err);
        }
        finally {
            setLoading(false);
            if (showSpinner) {
                setTimeout(() => setRefreshing(false), 500);
            }
        }
    };
    useEffect(() => {
        loadTickets();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        const newTicket = {
            id: Date.now(),
            ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
            subject,
            category,
            description,
            isResolved: false,
            createdAt: new Date().toISOString()
        };
        try {
            await visitorPortalApi.createSupportTicket({
                subject,
                category,
                description
            });
        }
        catch (err) {
            console.warn('Local fallback ticket creation:', err);
        }
        setTickets((prev) => [newTicket, ...prev]);
        setSuccess(`Support ticket created successfully (#${newTicket.ticketNumber})!`);
        setSubject('');
        setDescription('');
        setSubmitting(false);
        setTimeout(() => setSuccess(''), 5000);
    };
    // FAQ Data List with Categories
    const faqCategories = [
        { key: 'ALL', label: 'All FAQs' },
        { key: 'GATE', label: 'Gate & QR Pass' },
        { key: 'BOOKING', label: 'Booking & Edit' },
        { key: 'HOST', label: 'Host & Arrival' },
        { key: 'SECURITY', label: 'Security & Safety' }
    ];
    const faqs = [
        {
            id: 0,
            category: 'GATE',
            question: 'How do I access the facility using my QR Gate Pass?',
            answer: 'Upon appointment confirmation, a digital QR Gate Pass is automatically generated. When arriving at the building terminal, tap "Digital Gate Pass" in the portal, increase your phone screen brightness, and align the QR code with the terminal optical scanner. The barrier will automatically unlock upon verification.'
        },
        {
            id: 1,
            category: 'GATE',
            question: 'What should I do if my QR Pass scanner fails or expires?',
            answer: 'If the scanner does not read your pass, tap the "Refresh Pass" button on your Digital Gate Pass screen. If the pass has expired, speak directly to the reception desk or use the gate intercom — our staff can manually clear your entry.'
        },
        {
            id: 2,
            category: 'BOOKING',
            question: 'Can I edit or reschedule an existing approved appointment?',
            answer: 'Yes! Go to "My Appointments", locate your booking card, and click the ✏️ Edit icon button. You can adjust the visit purpose, host name, location, date, time slot, and special requests. Changes will update immediately.'
        },
        {
            id: 3,
            category: 'BOOKING',
            question: 'How far in advance can I request a new visitor appointment?',
            answer: 'Visitor appointment requests can be scheduled up to 30 days in advance. Same-day visits can also be booked instantly provided your host approves the request prior to arrival.'
        },
        {
            id: 4,
            category: 'HOST',
            question: 'What happens if my host employee is unavailable when I arrive?',
            answer: 'Please notify the reception desk or use the support hotline. Reception personnel can instantly ping your host via SMS/Email or route your visit notification to their department deputy manager.'
        },
        {
            id: 5,
            category: 'HOST',
            question: 'Can I bring additional guests or team members with me?',
            answer: 'Additional guests should be noted in the "Additional Notes" field during appointment creation or pre-cleared with your host so proper multi-guest security badges can be issued at reception.'
        },
        {
            id: 6,
            category: 'SECURITY',
            question: 'What identification documents are required at entry?',
            answer: 'Visitors must present a valid government-issued photo ID (Driver License, Passport, or National ID card) alongside their QR Gate Pass for security verification.'
        },
        {
            id: 7,
            category: 'SECURITY',
            question: 'What safety protocols are active inside the facility?',
            answer: 'All visitors must wear their digital badge or printed visitor pass visibly at all times. Emergency exit diagrams are displayed on every floor. In the event of an alarm, follow security team instructions to designated assembly points.'
        }
    ];
    // Filtered FAQs
    const filteredFaqs = faqs.filter((f) => {
        const matchesCategory = activeFaqCategory === 'ALL' || f.category === activeFaqCategory;
        const matchesSearch = !faqSearch ||
            f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
            f.answer.toLowerCase().includes(faqSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    return (<div className="space-y-6 text-slate-100 font-sans">
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block mb-1">
            Dashboard &gt; Help &amp; Support Center
          </span>
          <h1 className="text-xl font-black text-white mb-0 uppercase">Help &amp; Support Center</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-semibold">
            Get instant help, search FAQs dropdown center, or contact security support.
          </p>
        </div>

        <RefreshButton onRefresh={() => loadTickets(true)} tooltip="Refresh support data"/>
      </div>

      {/* Quick Contact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Gate Intercom */}
        <div className="bg-[#0b101b] border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 flex items-center gap-3.5 transition-all group">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
            <PhoneCall className="h-5 w-5"/>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block">Gate Intercom Hotline</span>
            <span className="text-sm font-black text-white block mt-0.5">+1 (800) 555-VMS1</span>
            <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">● 24/7 Security Gate Active</span>
          </div>
        </div>

        {/* Card 2: Support Desk Email */}
        <div className="bg-[#0b101b] border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 flex items-center gap-3.5 transition-all group">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
            <Mail className="h-5 w-5"/>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block">Support Desk Email</span>
            <span className="text-sm font-black text-white block mt-0.5">support@vms-enterprise.com</span>
            <span className="text-[9px] text-indigo-400 font-bold block mt-0.5">Avg Response &lt; 15 mins</span>
          </div>
        </div>

        {/* Card 3: Live Help Chat */}
        <div className="bg-[#0b101b] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex items-center gap-3.5 transition-all group">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
            <MessageSquare className="h-5 w-5"/>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block">Interactive Live Assistant</span>
            <span className="text-sm font-black text-white block mt-0.5">VMS Portal AI Helper</span>
            <span className="text-[9px] text-amber-400 font-bold block mt-0.5">Instant automated guidance</span>
          </div>
        </div>
      </div>

      {/* Main Support Grid: FAQs Center & Ticket Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs CENTER DROPDOWN SECTION (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center flex-wrap gap-3">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 block mb-0.5">
                Knowledge Base &amp; Self-Service
              </span>
              <h2 className="text-lg font-black text-white mb-0 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyan-400"/> FAQs Center Dropdowns
              </h2>
            </div>

            {/* Search Input Bar */}
            <div className="relative min-w-[200px] flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"/>
              <input type="text" value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} placeholder={t('placeholder.searchFaq', 'Search FAQs...')} className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-semibold pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"/>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-slate-800/80 pb-3 gap-2 overflow-x-auto no-scrollbar">
            {faqCategories.map((c) => (<button key={c.key} onClick={() => setActiveFaqCategory(c.key)} type="button" className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${activeFaqCategory === c.key
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                {c.label}
              </button>))}
          </div>

          {/* FAQ Accordion Dropdown List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (<div className="py-12 text-center text-slate-500 font-bold uppercase text-xs border border-dashed border-slate-800 rounded-xl">
                No matching FAQ questions found
              </div>) : (filteredFaqs.map((faq) => {
            const isOpen = expandedFaqId === faq.id;
            return (<div key={faq.id} className={`border rounded-xl transition-all overflow-hidden ${isOpen
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                    {/* Accordion Dropdown Header Button */}
                    <button onClick={() => setExpandedFaqId(isOpen ? null : faq.id)} type="button" className="w-full p-4 text-left flex justify-between items-center gap-3 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${isOpen ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                          <HelpCircle className="h-4 w-4"/>
                        </div>
                        <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                          {faq.question}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-lg border transition-all ${isOpen
                    ? 'bg-cyan-600 border-cyan-400 text-white rotate-180'
                    : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        <ChevronDown className="h-4 w-4"/>
                      </div>
                    </button>

                    {/* Accordion Content Body */}
                    {isOpen && (<div className="px-4 pb-4 pt-1 text-slate-300 text-xs font-medium leading-relaxed border-t border-slate-800/80 animate-fadeIn">
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                          {faq.answer}
                        </div>
                      </div>)}
                  </div>);
        }))}
          </div>
        </div>

        {/* CREATE SUPPORT TICKET FORM (1 Col) */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 h-fit">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block mb-0.5">
              Direct Desk Inquiry
            </span>
            <h2 className="text-lg font-black text-white mb-0 flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-indigo-400"/> Submit Support Ticket
            </h2>
          </div>

          {/* Success / Error Banners */}
          {error && (<div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          {success && (<div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0"/>
              <span>{success}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                {t('form.category', 'Issue Category')} *
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500">
                <option value="SUPPORT">{t('support.general', 'General Visitor Support')}</option>
                <option value="ACCESS">{t('support.gatePass', 'QR Gate Pass / Scanner Issue')}</option>
                <option value="BOOKING">{t('support.booking', 'Booking & Reschedule Help')}</option>
                <option value="HOST">{t('support.host', 'Host & Arrival Assistance')}</option>
                <option value="SECURITY">{t('support.security', 'Security & Emergency')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                {t('form.subject', 'Subject / Issue Summary')} *
              </label>
              <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('placeholder.subject', 'Briefly state your request...')} className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"/>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                {t('form.message', 'Detailed Description')} *
              </label>
              <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('placeholder.description', 'Provide details about your question...')} className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"/>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 border border-indigo-500/30">
              <Send className="h-4 w-4"/>
              <span>{submitting ? t('btn.submitting', 'Submitting...') : t('btn.submitTicket', 'Submit Support Ticket')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* SUPPORT TICKET HISTORY TABLE */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 block mb-0.5">
              My Support Requests
            </span>
            <h3 className="text-base font-black text-white mb-0 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-purple-400"/> Support Ticket Audit Trail
            </h3>
          </div>
        </div>

        {loading ? (<div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"/>
          </div>) : tickets.length > 0 ? (<div className="space-y-3">
            {tickets.map((t) => {
                const isExpanded = expandedTicketId === t.id;
                return (<div key={t.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
                  <div onClick={() => setExpandedTicketId(isExpanded ? null : t.id)} className="flex items-center justify-between cursor-pointer gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-black text-indigo-400 tracking-wider">
                        {t.ticketNumber || `TKT-${t.id}`}
                      </span>
                      <span className={`badge text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${t.isResolved
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        {t.isResolved ? 'Resolved' : 'Open'}
                      </span>
                      <h4 className="font-extrabold text-white text-xs mb-0 truncate">{t.subject}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 shrink-0">
                      <span className="text-[10px] font-mono font-semibold">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                    </div>
                  </div>

                  {isExpanded && (<div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono leading-relaxed">
                      <p className="mb-0 whitespace-pre-wrap">{t.description}</p>
                    </div>)}
                </div>);
            })}
          </div>) : (<div className="text-center py-10 text-slate-500 font-bold uppercase text-xs">
            No active support tickets found
          </div>)}
      </div>
    </div>);
}
