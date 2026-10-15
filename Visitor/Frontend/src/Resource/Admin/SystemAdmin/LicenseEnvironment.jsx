import React from 'react';
import { Key, Server, ShieldCheck } from 'lucide-react';
export default function LicenseEnvironment() {
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Key className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">License & Environment Information</h1>
            <p className="text-xs text-slate-400">Enterprise license key status, node instance metadata, and active capacity limits</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400"/> Enterprise Software License
          </h3>
          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <p>Edition: <strong className="text-white">Enterprise Unlimited Suite</strong></p>
            <p>License Status: <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ACTIVE VALID</span></p>
            <p>Licensed To: <strong className="text-indigo-300">Hybrid Tech Enterprise HQ</strong></p>
            <p>Expiration: <strong className="text-slate-200">2029-12-31 (Perpetual Enterprise Subscription)</strong></p>
            <p>Max Allowed Kiosks: <strong className="text-cyan-400">UNLIMITED</strong></p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="h-4 w-4 text-indigo-400"/> Node & Hosting Environment
          </h3>
          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <p>Environment: <strong className="text-white">PRODUCTION (NODE_ENV)</strong></p>
            <p>Node.js Runtime: <strong className="text-slate-200">v26.3.1 (x64 Windows)</strong></p>
            <p>Port Binding: <strong className="text-indigo-400">HTTP 5000 / WebSocket WS 5000</strong></p>
            <p>Vite Frontend Port: <strong className="text-cyan-400">HTTP 5173</strong></p>
          </div>
        </div>
      </div>
    </div>);
}
