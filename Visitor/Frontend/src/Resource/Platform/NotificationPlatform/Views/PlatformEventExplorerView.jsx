import React from 'react';
import { Zap } from 'lucide-react';
const PlatformEventExplorerView = () => {
    const events = [
        { name: 'user.registered', cat: 'Authentication', desc: 'New user account registered' },
        { name: 'user.password.changed', cat: 'Authentication', desc: 'Password reset or changed' },
        { name: 'visitor.registered', cat: 'Visitor', desc: 'Pre-registered visitor creation' },
        { name: 'visitor.checked.in', cat: 'Visitor', desc: 'Visitor check-in scan completed' },
        { name: 'appointment.created', cat: 'Appointment', desc: 'New appointment requested' },
        { name: 'visitor.arrived', cat: 'Reception', desc: 'Visitor arrived at front desk' },
        { name: 'blacklist.detected', cat: 'Security', desc: 'Blacklist/watchlist match detected' },
        { name: 'emergency.triggered', cat: 'Security', desc: 'Panic alert or lockdown triggered' },
        { name: 'backup.completed', cat: 'Administration', desc: 'Automated database backup completed' }
    ];
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400"/> Business Event Catalog Explorer
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Explore standard business events published across all VMS modules.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((e, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs">
            <span className="font-mono text-amber-400 font-bold block">{e.name}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold border border-slate-700 mt-1 inline-block">{e.cat}</span>
            <p className="text-slate-400 mt-2">{e.desc}</p>
          </div>))}
      </div>
    </div>);
};
export default PlatformEventExplorerView;
