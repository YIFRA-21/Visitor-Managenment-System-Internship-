import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Lock, Sparkles, Activity } from 'lucide-react';

const STATUS_MESSAGES = [
  'Initializing Security & Biometric Protocols...',
  'Connecting to Enterprise Access Gateway...',
  'Synchronizing Visitor & Personnel Registry...',
  'Securing Zero-Trust Encrypted Session...',
  'Finalizing System Interface...'
];

export default function LoadingScreen({ message }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);

    const progInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 280);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#040812] select-none">
      {/* Background Cinematic Image with Subtle Slow Zoom */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out scale-105"
        style={{
          backgroundImage: "url('/vms-loading-bg.jpg')",
          filter: 'brightness(0.38) saturate(1.2)'
        }}
      />

      {/* Cyber Grid & Ambient Radial Light Cones */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.35)_0%,rgba(4,8,18,0.92)_75%,rgba(2,4,10,0.98)_100%)]" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1.5s]" />

      {/* Central Glassmorphism Card */}
      <div className="relative z-10 max-w-lg w-[92%] sm:w-full mx-auto p-8 sm:p-10 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/25 shadow-[0_0_80px_rgba(30,58,138,0.45)] text-center flex flex-col items-center">
        
        {/* Orbital Futuristic Spinning Rings */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6 flex items-center justify-center">
          {/* Outer glowing pulsed ring */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping [animation-duration:3s]" />
          
          {/* Outer orbital dash ring */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 border-r-transparent animate-spin [animation-duration:2.5s]" />
          
          {/* Middle counter-spinning ring */}
          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 border-b-cyan-300 border-l-transparent animate-spin [animation-duration:4s] [animation-direction:reverse]" />
          
          {/* Inner pulsating glow disc */}
          <div className="absolute inset-5 rounded-full bg-gradient-to-tr from-indigo-600/40 to-cyan-500/30 blur-md animate-pulse" />
          
          {/* Core Logo / Security Shield */}
          <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/90 border border-indigo-400/50 flex items-center justify-center shadow-inner shadow-indigo-500/40 group">
            <img 
              src="/logo.png" 
              alt="VMS Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <ShieldCheck className="w-10 h-10 text-cyan-400 hidden drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          </div>
        </div>

        {/* Title & VMS Branding */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold tracking-widest uppercase mb-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Enterprise Access Control</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center justify-center flex-wrap gap-2">
            <span className="bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
              Visitor Management System
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-black tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              (VMS)
            </span>
          </h1>

          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Next-Gen Smart Security, Reception & Biometric Gateways
          </p>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="w-full max-w-xs space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-semibold px-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{message || STATUS_MESSAGES[msgIndex]}</span>
            </span>
            <span className="text-indigo-300 font-bold">{progress}%</span>
          </div>

          {/* Shimmer Bar */}
          <div className="relative h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400 rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)] animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>

        {/* Cyber Telemetry Badges Footer */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-500 tracking-wider uppercase pt-2 border-t border-slate-800/60 w-full">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" /> TLS 1.3 SECURE
          </span>
          <span>â€¢</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> BIO-ACCELERATED
          </span>
          <span>â€¢</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}
