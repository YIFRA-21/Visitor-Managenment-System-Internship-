import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950">
      {/* Dynamic Animated Ambient Glow Spheres (Vibrant colors, no black background) */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-gradient-to-br from-indigo-500/30 to-purple-600/25 rounded-full blur-[110px] pointer-events-none animate-pulse [animation-duration:4s]" />
      <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-gradient-to-tl from-cyan-400/30 to-blue-600/25 rounded-full blur-[110px] pointer-events-none animate-pulse [animation-duration:5s] [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-500/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Central Premium Frosted Glassmorphism Card */}
      <div className="relative z-10 max-w-md w-[92%] sm:w-full mx-auto p-9 sm:p-12 rounded-3xl bg-white/[0.12] backdrop-blur-2xl border border-white/25 shadow-[0_20px_70px_rgba(30,58,138,0.45)] text-center flex flex-col items-center">
        
        {/* Full-Way Rotating Ring & Logo Container */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 mb-8 flex items-center justify-center">
          {/* Outer Full-Way Continuous Glowing Gradient Ring (rotates full 360°) */}
          <div className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 animate-spin [animation-duration:3s] [animation-timing-function:linear] shadow-[0_0_30px_rgba(99,102,241,0.55)]">
            <div className="w-full h-full rounded-full bg-slate-900/40 backdrop-blur-sm" />
          </div>

          {/* Full-Way 360° Orbital Satellite Beacon */}
          <div className="absolute inset-0 rounded-full animate-spin [animation-duration:2.4s] [animation-timing-function:linear]">
            <div className="w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_18px_#22d3ee] -top-2 left-1/2 -translate-x-1/2 absolute" />
          </div>

          {/* Inner Counter-Rotating Full-Way Ring */}
          <div className="absolute inset-3 rounded-full p-[2.5px] bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 animate-spin [animation-duration:4s] [animation-timing-function:linear] [animation-direction:reverse] opacity-85">
            <div className="w-full h-full rounded-full bg-slate-900/25" />
          </div>

          {/* Pulsing Center Light Aura */}
          <div className="absolute inset-5 rounded-full bg-gradient-to-tr from-indigo-500/35 to-cyan-400/35 blur-lg animate-pulse" />

          {/* Core Crisp White Pedestal for Logo (blends logo seamlessly with no black box) */}
          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-xl shadow-indigo-500/30 border border-white/90 flex items-center justify-center p-3 transition-transform duration-500 hover:scale-105">
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

        {/* ONLY Allowed Text: Visitor Management System(VMS) */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center flex-wrap gap-2.5 mb-7">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-md">
            Visitor Management System
          </span>
          <span className="inline-block px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs sm:text-sm font-black tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/40">
            (VMS)
          </span>
        </h1>

        {/* Sleek Gradient Wave Loading Bar (Smooth Indeterminate Flow, NO extra text) */}
        <div className="w-full max-w-[240px] h-2.5 bg-white/15 rounded-full overflow-hidden p-0.5 border border-white/20 shadow-inner relative">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 animate-[vmsBar_1.8s_ease-in-out_infinite] shadow-[0_0_15px_rgba(99,102,241,0.7)]" />
        </div>

      </div>

      {/* Embedded CSS Keyframes for Smooth Loading Movement */}
      <style>{`
        @keyframes vmsBar {
          0% {
            transform: translateX(-100%);
            width: 45%;
          }
          50% {
            transform: translateX(100%);
            width: 75%;
          }
          100% {
            transform: translateX(250%);
            width: 45%;
          }
        }
      `}</style>
    </div>
  );
}
