import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Activity } from 'lucide-react';

export default function LoadingScreen({ message = "Visitor Management System" }) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(18);

  const statusMessages = [
    "Initializing Zero-Trust Security Gateway...",
    "Synchronizing Biometric & Access Logs...",
    "Establishing Encrypted Core Grid Connection...",
    "Verifying Identity Authorization...",
    "System Verified • Launching Environment..."
  ];

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % statusMessages.length);
    }, 1800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const jump = Math.floor(Math.random() * 7) + 5;
        return Math.min(98, prev + jump);
      });
    }, 320);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
    };
  }, [statusMessages.length]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none bg-[#040812]">
      {/* 1. Ultra-High Definition Enterprise Lobby Background with Slow Ken-Burns Cinematic Drift */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.62] saturate-[1.25] pointer-events-none animate-[kenBurns_30s_ease-in-out_infinite_alternate]"
        style={{ backgroundImage: "url('/vms-loading-bg.jpg')" }}
      />

      {/* 2. Ambient Cosmic Radial Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.72) 50%, rgba(4, 7, 15, 0.96) 100%)'
        }}
      />

      {/* 3. Subtle Cyber Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />

      {/* 4. Dynamic Animated Ambient Glow Spheres */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-to-br from-cyan-500/25 to-blue-600/15 rounded-full blur-[130px] pointer-events-none animate-pulse [animation-duration:5s]" />
      <div className="absolute -bottom-32 -right-32 w-[540px] h-[540px] bg-gradient-to-tl from-indigo-600/25 to-cyan-400/20 rounded-full blur-[130px] pointer-events-none animate-pulse [animation-duration:6s] [animation-delay:2s]" />

      {/* 5. Central Premium Frosted Glassmorphic Card */}
      <div 
        className="relative z-10 max-w-[480px] w-[92%] mx-auto px-8 py-9 sm:px-10 sm:py-11 rounded-[2rem] text-center flex flex-col items-center shadow-2xl transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 22, 41, 0.82) 0%, rgba(8, 14, 28, 0.90) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 35px 90px -15px rgba(0, 0, 0, 0.9), 0 0 70px rgba(6, 182, 212, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
        }}
      >
        {/* Specular Sheen Bar across Top of Card */}
        <div className="absolute top-0 left-12 right-12 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none" />

        {/* Top System Security Badge */}
        <div className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Zero-Trust Enterprise Access</span>
        </div>

        {/* 6. Multi-Layered Rotating Quantum Spinner with Logo Centerpiece */}
        <div className="relative w-[140px] h-[140px] mb-6 flex items-center justify-center">
          
          {/* Ambient Behind-Logo Glow Aura */}
          <div 
            className="absolute inset-1 rounded-full pointer-events-none animate-pulse [animation-duration:3s]"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(99, 102, 241, 0.2) 60%, transparent 100%)',
              filter: 'blur(16px)'
            }}
          />

          {/* Subtle Stationary Background Track Ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-white/[0.08]" />

          {/* Outer Smooth Transparency-Gradient Rotating Beam (Conic Transparency Trail) */}
          <div 
            className="absolute inset-0 rounded-full animate-spin [animation-duration:2s] [animation-timing-function:linear]"
            style={{
              padding: '3.5px',
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 35%, rgba(6, 182, 212, 0.15) 55%, rgba(56, 189, 248, 0.6) 80%, #00f0ff 100%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 3.5px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 3.5px))',
              filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.8))'
            }}
          />

          {/* Orbiting Satellite Glow Beacon at the Leading Edge (0°) */}
          <div className="absolute inset-0 rounded-full animate-spin [animation-duration:2s] [animation-timing-function:linear] pointer-events-none">
            <div 
              className="absolute -top-[3.5px] left-1/2 -translate-x-1/2 w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_12px_#00f0ff,0_0_24px_#38bdf8]"
            />
          </div>

          {/* Inner Counter-Spinning Technical Dashed Ring */}
          <div 
            className="absolute inset-2.5 rounded-full border-[1.5px] border-dashed border-cyan-400/40 animate-spin [animation-duration:7s] [animation-timing-function:linear] [animation-direction:reverse]"
          />

          {/* Orbiting Satellite 2 at 180° counter-spinning */}
          <div className="absolute inset-2.5 rounded-full animate-spin [animation-duration:7s] [animation-timing-function:linear] [animation-direction:reverse] pointer-events-none">
            <div 
              className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]"
            />
          </div>

          {/* Crisp Pure White Center Logo Pedestal */}
          <div 
            className="relative z-10 w-[80px] h-[80px] rounded-2xl bg-white p-2 flex items-center justify-center transition-transform duration-300 hover:scale-105 shadow-xl"
            style={{
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 28px rgba(56, 189, 248, 0.35)'
            }}
          >
            <img 
              src="/logo.png" 
              alt="Visitor Management System Logo" 
              className="w-full h-full object-contain drop-shadow-sm"
              onError={(e) => {
                if (!e.target.dataset.tried) {
                  e.target.dataset.tried = '1';
                  e.target.src = '/vms-logo.png';
                }
              }}
            />
          </div>
        </div>

        {/* 7. Title & ( VMS ) Badge */}
        <h1 className="text-[1.55rem] sm:text-[1.7rem] font-black tracking-tight text-white flex items-center justify-center flex-wrap gap-2.5 mb-2">
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #e0f2fe 70%, #38bdf8 100%)',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.4)'
            }}
          >
            {message}
          </span>
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-lg font-mono text-[0.82rem] font-black tracking-wider"
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.25)'
            }}
          >
            ( VMS )
          </span>
        </h1>

        {/* Dynamic Status Text */}
        <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium h-5 flex items-center justify-center gap-1.5 mb-6 transition-all duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">{statusMessages[statusIdx]}</span>
        </p>

        {/* 8. Sleek Glowing Dynamic Progress Bar with Real-time Percentage */}
        <div className="w-full max-w-[280px] space-y-2">
          <div 
            className="h-[6px] w-full rounded-full overflow-hidden relative"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)'
            }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out relative"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #0ea5e9 0%, #00f0ff 60%, #818cf8 100%)',
                boxShadow: '0 0 12px #00f0ff'
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
            </div>
          </div>

          {/* Status Metadata Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 px-0.5">
            <span className="flex items-center gap-1 text-slate-400">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>SECURE BOOT</span>
            </span>
            <span className="font-bold text-cyan-300">{progress}%</span>
          </div>
        </div>

        {/* 9. Bottom Enterprise Compliance Badge */}
        <div className="mt-7 pt-4 border-t border-white/10 w-full flex items-center justify-center gap-3 sm:gap-4 text-[10px] text-slate-400/80 font-mono flex-wrap">
          <span className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-indigo-400" /> AES-256 GCM
          </span>
          <span className="text-slate-600">•</span>
          <span>ISO 27001 COMPLIANT</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">ALL SYSTEMS LIVE</span>
        </div>
      </div>

      {/* Embedded CSS Keyframes for Cinematic Movement */}
      <style>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1.0) translate(0%, 0%);
          }
          50% {
            transform: scale(1.08) translate(-1%, -1%);
          }
          100% {
            transform: scale(1.03) translate(1%, 0.5%);
          }
        }
      `}</style>
    </div>
  );
}
