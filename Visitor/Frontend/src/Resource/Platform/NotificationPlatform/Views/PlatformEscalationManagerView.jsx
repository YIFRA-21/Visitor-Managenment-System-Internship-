import React from 'react';
import { ArrowUpRight } from 'lucide-react';
const PlatformEscalationManagerView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-purple-400"/> Multi-Level Escalation Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure timeout escalation paths for unacknowledged security incidents or pending approvals.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Level 1 → Level 2 Security Escalation', timeout: '10 Minutes', path: 'Guard On Duty → SOC Supervisor → Chief Security Officer' },
            { title: 'Host Unresponsive Visitor Waiting Escalation', timeout: '15 Minutes', path: 'Host Employee → Reception Supervisor → Department Head' }
        ].map((e, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{e.title}</span>
              <span className="text-slate-400 mt-0.5 block">Timeout: {e.timeout} • Escalation Path: <span className="text-purple-300">{e.path}</span></span>
            </div>
            <button className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded font-semibold hover:bg-purple-600/30">
              Edit Workflow
            </button>
          </div>))}
      </div>
    </div>);
};
export default PlatformEscalationManagerView;
