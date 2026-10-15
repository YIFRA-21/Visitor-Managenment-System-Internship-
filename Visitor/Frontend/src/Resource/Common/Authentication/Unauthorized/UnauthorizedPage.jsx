import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, HelpCircle } from 'lucide-react';
export default function UnauthorizedPage() {
    return (<div className="flex min-h-screen items-center justify-center bg-[#070b13] text-slate-100 font-sans relative overflow-hidden px-4">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-red-950/10 blur-[130px] pointer-events-none"/>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"/>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="bg-[#0b101b]/95 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500"/>
          
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-red-500/30 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="h-8 w-8 text-red-500"/>
            </div>
          </div>

          <h1 className="text-2xl font-black text-white uppercase tracking-widest">403 FORBIDDEN</h1>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-2">Access Denied</h2>
          
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            Your system account has insufficient clearance to access this resource route. This transaction has been audited by internal security protocols.
          </p>

          <div className="mt-8 space-y-3">
            <Link to="/dashboard" className="w-full btn-primary bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(99,102,241,0.15)]">
              <ArrowLeft className="h-4 w-4"/>
              <span>Return to Dashboard</span>
            </Link>
            <a href="mailto:security@organization.com" className="w-full border border-slate-800 hover:border-slate-700 hover:text-white text-slate-400 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all">
              <HelpCircle className="h-4 w-4"/>
              <span>Contact Security Administrator</span>
            </a>
          </div>
        </div>
      </div>
    </div>);
}
