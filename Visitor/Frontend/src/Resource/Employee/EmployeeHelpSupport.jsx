import React, { useState } from 'react';
import { HelpCircle, BookOpen, Send, Search, CheckCircle2, PhoneCall, AlertCircle, } from 'lucide-react';
import { employeePortalApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

export default function EmployeeHelpSupport() {
    const { t } = useLanguage();
    const { toSuccess, toError } = useResponseNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [ticketForm, setTicketForm] = useState({
        subject: '',
        category: 'General Technical',
        priority: 'MEDIUM',
        description: '',
    });
    const faqs = [
        {
            q: 'How do I approve a visitor request submitted for me?',
            a: 'Navigate to the Visitor Requests tab in your Employee Portal. Click "Approve" next to the request. You can optionally add host instructions for reception.',
        },
        {
            q: 'How can guests register when arriving at reception?',
            a: 'Guests receive a digital pass with a QR code upon host approval or pre-registration. They present this QR code at the reception kiosk scanner for instant badge printing.',
        },
        {
            q: 'What should I do if a guest needs to reschedule?',
            a: 'Open your Visitor Requests or Appointments list, select the guest appointment, and click "Reschedule". Enter the new proposed start and end time.',
        },
        {
            q: 'How do I reserve a conference room for a meeting?',
            a: 'Go to Meeting Management, check live room availability, click "Reserve Room", select your start/end time, and submit your reservation.',
        },
    ];
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await employeePortalApi.createSupportTicket(ticketForm);
            setShowTicketModal(false);
            toSuccess({
                type: RESPONSE_TYPES.SUPPORT_TICKET_SUBMITTED,
                title: 'Support Ticket Submitted',
                message: `Your technical support ticket "${ticketForm.subject}" has been queued for immediate review.`,
                referenceId: res.data?.ticket?.ticket_number || 'TKT-1029',
                entityType: 'Support Ticket',
                entityName: ticketForm.subject,
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            toError(err, {
                title: 'Ticket Submission Failed',
                entityType: 'Support Ticket',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    const filteredFaqs = faqs.filter((f) => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()));
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Host Help & Support Center</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Search documentation, FAQs, or contact system administrators for assistance.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setShowTicketModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95">
            <Send className="h-4 w-4"/>
            <span>Create Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (<div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center space-x-3 text-xs font-bold">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>)}

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="h-5 w-5 text-slate-500 absolute left-4 top-3.5"/>
        <input type="text" placeholder={t('support.placeholder_search_topics', 'Search support topics, guides, FAQs...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800/80 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-2xl"/>
      </div>

      {/* Grid: FAQs & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FAQs list */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => (<div key={i} className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0"/>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium pl-6 leading-relaxed">{faq.a}</p>
              </div>))}
          </div>
        </div>

        {/* Support Hotline & Direct Assistance */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Help Desk Hotlines</h2>
          <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <PhoneCall className="h-5 w-5"/>
              </div>
              <div>
                <p className="text-white font-bold">IT Help Desk Line</p>
                <p className="text-slate-400 font-mono">+1-555-0100 (Ext. 9)</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <BookOpen className="h-5 w-5"/>
              </div>
              <div>
                <p className="text-white font-bold">Security Operations Center</p>
                <p className="text-slate-400 font-mono">soc@enterprise.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-400"/>
                <span>Create Support Ticket</span>
              </h3>
              <button onClick={() => setShowTicketModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">{t('support.subject', 'Subject')}</label>
                <input type="text" value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder={t('support.placeholder_summary_issue', 'Summary of issue...')} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" required/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('support.category', 'Category')}</label>
                  <select value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    <option value="General Technical">{t('support.category_general_tech', 'General Technical')}</option>
                    <option value="Scanner Issue">{t('support.category_scanner_issue', 'Scanner Issue')}</option>
                    <option value="Access Permissions">{t('support.category_access_permissions', 'Access Permissions')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('support.priority', 'Priority')}</label>
                  <select value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    <option value="LOW">{t('support.priority_low', 'Low')}</option>
                    <option value="MEDIUM">{t('support.priority_medium', 'Medium')}</option>
                    <option value="HIGH">{t('support.priority_high', 'High')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">{t('support.issue_description', 'Issue Description')}</label>
                <textarea rows={3} value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder={t('support.placeholder_issue_details', 'Provide detailed information...')} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500" required/>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTicketModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase">
                  {submitting ? t('common.submitting', 'Submitting...') : t('support.submit_ticket', 'Submit Ticket')}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
