import React from 'react';
import { HelpCircle, BookOpen, MessageCircle, ExternalLink } from 'lucide-react';
const ReceptionHelpSupportView = () => {
    const faqs = [
        { q: 'How do I process a walk-in visitor check-in?', a: 'Navigate to Check-In Notifications → Click "Process Action" on the visitor record → Verify identity → Print badge → Notify host.' },
        { q: 'What happens when a blacklisted visitor is detected?', a: 'The system immediately generates a Critical Security Alert, locks the check-in flow, dispatches the security officer, and logs the incident in the audit trail.' },
        { q: 'Can I reassign a visitor from my queue to another desk?', a: 'Yes. Go to Waiting Queue Alerts → Click "Reassign Queue Load" → Select the target desk and confirm.' },
        { q: 'How do emergency alerts bypass quiet hours?', a: 'Fire, medical, lockdown, evacuation, and panic alerts automatically override quiet hours and sound mute settings. This cannot be disabled for safety compliance.' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400"/> Reception Help & Support
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Front-desk operational guidelines, check-in workflows, badge printing FAQs, and escalation procedures.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (<details key={i} className="group bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
            <summary className="p-4 cursor-pointer font-bold text-white flex items-center gap-2 list-none">
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0"/>
              <span>{faq.q}</span>
            </summary>
            <div className="px-4 pb-4 text-slate-300 leading-relaxed border-t border-slate-900 pt-3 ml-6">
              {faq.a}
            </div>
          </details>))}
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400"/>
          <span className="text-slate-300">Need more help? Contact IT Support or your Reception Supervisor.</span>
        </div>
        <button className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
          Open Support Ticket <ExternalLink className="w-3 h-3"/>
        </button>
      </div>
    </div>);
};
export default ReceptionHelpSupportView;
