import React from 'react';
import BackButton from '../../components/common/BackButton';
export default function AccessControl() {
    return (<div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl transition-all duration-300 hover:border-indigo-500/50 space-y-4">
      <div className="flex items-center gap-3">
        <BackButton fallbackUrl="/dashboard"/>
        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">Access Control Gateways</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Validate security clearances</p>
        </div>
      </div>
      <div className="max-w-md bg-[#0b101b] border border-slate-800 rounded-xl p-6">
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-lg text-cyan-400">
            Gate 1 (Reception): <span className="font-bold">ONLINE</span>
          </div>
          <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-lg text-cyan-400">
            Gate 2 (Main Lift): <span className="font-bold">ONLINE</span>
          </div>
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-red-400">
            Gate 3 (Secure Wing): <span className="font-bold">LOCKED</span>
          </div>
        </div>
      </div>
    </div>);
}
