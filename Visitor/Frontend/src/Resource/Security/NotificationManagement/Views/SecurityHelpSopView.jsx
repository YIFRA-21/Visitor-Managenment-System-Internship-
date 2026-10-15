import React from 'react';
import { BookOpen, ExternalLink, MessageCircle } from 'lucide-react';
const SecurityHelpSopView = () => {
    const sops = [
        { q: 'What do I do when a blacklist match is detected at the turnstile?', a: 'Immediately lock the turnstile lane, contact the SOC supervisor, dispatch a guard to the location, initiate a hold order, and open an investigation case with CCTV evidence.' },
        { q: 'How do I initiate a campus lockdown?', a: 'Navigate to Emergency Console → Click "Trigger Campus Lockdown" → Confirm → All access points will lock, reception desks will receive lockdown alerts, and all security officers on shift will be notified instantly.' },
        { q: 'What is the procedure for door forced open alarms?', a: 'Review CCTV playback of the alarm timestamp, dispatch nearest patrol guard, check physical integrity of the door sensor, document findings in the investigation case, and escalate to facilities management.' },
        { q: 'How do I escalate a security alert?', a: 'Click "Escalate" on any alert → Provide a reason → The alert is automatically routed to the SOC Supervisor, Chief Security Officer, and on-call duty manager.' },
        { q: 'What happens if a panic alarm is triggered during quiet hours?', a: 'Emergency alerts (panic, fire, medical, lockdown) always bypass quiet hours. All on-duty security officers will receive immediate audio, desktop, and in-app notifications regardless of preference settings.' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400"/> Security Standard Operating Procedures (SOP) & Help
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Incident response workflows, escalation procedures, equipment troubleshooting, and compliance guidelines.</p>
      </div>

      <div className="space-y-3">
        {sops.map((sop, i) => (<details key={i} className="group bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
            <summary className="p-4 cursor-pointer font-bold text-white flex items-center gap-2 list-none">
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0"/>
              <span>{sop.q}</span>
            </summary>
            <div className="px-4 pb-4 text-slate-300 leading-relaxed border-t border-slate-900 pt-3 ml-6">
              {sop.a}
            </div>
          </details>))}
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400"/>
          <span className="text-slate-300">Need additional support? Contact the SOC Supervisor or IT Security Operations.</span>
        </div>
        <button className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
          Open Support Ticket <ExternalLink className="w-3 h-3"/>
        </button>
      </div>
    </div>);
};
export default SecurityHelpSopView;
