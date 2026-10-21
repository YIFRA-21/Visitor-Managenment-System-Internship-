import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none bg-[#070b13]">
      {/* Background Facility Image with Dark Security Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.55] saturate-[1.3] scale-105 pointer-events-none"
        style={{ backgroundImage: "url('/vms-loading-bg.jpg')" }}
      />

      {/* Ambient Cosmic Radial Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(37,99,235,0.25) 0%, rgba(15,23,42,0.85) 60%, rgba(7,11,19,0.98) 100%)' }}
      />

      {/* Dynamic Animated Ambient Glow Spheres */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-gradient-to-br from-cyan-500/20 to-blue-600/15 rounded-full blur-[110px] pointer-events-none animate-pulse [animation-duration:4s]" />
      <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-gradient-to-tl from-indigo-500/20 to-cyan-400/15 rounded-full blur-[110px] pointer-events-none animate-pulse [animation-duration:5s] [animation-delay:2s]" />

      {/* Central Premium Frosted Glassmorphic Card */}
      <div 
        className="relative z-10 max-w-[440px] w-[90%] mx-auto px-8 py-10 sm:px-10 sm:py-12 rounded-[1.75rem] text-center flex flex-col items-center"
        style={{
          background: 'rgba(13, 20, 36, 0.78)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.85), 0 0 60px rgba(6, 182, 212, 0.16)'
        }}
      >
        {/* 360° Rotating Transparency-Trail Spinner & Logo Container */}
        <div className="relative w-[136px] h-[136px] mb-7 flex items-center justify-center">
          
          {/* Ambient Behind-Logo Glow Aura */}
          <div 
            className="absolute inset-3 rounded-full pointer-events-none animate-pulse [animation-duration:3s]"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 100%)',
              filter: 'blur(14px)'
            }}
          />

          {/* Subtle Stationary Background Track Ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-white/[0.06]" />

          {/* Outer Smooth Transparency-Gradient Rotating Beam (Conic Transparency Trail) */}
          <div 
            className="absolute inset-0 rounded-full animate-spin [animation-duration:1.8s] [animation-timing-function:linear]"
            style={{
              padding: '3.5px',
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 30%, rgba(6, 182, 212, 0.1) 50%, rgba(56, 189, 248, 0.5) 80%, #00f0ff 100%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 3.5px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 3.5px))',
              filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.65))'
            }}
          />

          {/* Orbiting Satellite Glow Beacon at the Leading Edge */}
          <div className="absolute inset-0 rounded-full animate-spin [animation-duration:1.8s] [animation-timing-function:linear] pointer-events-none">
            <div 
              className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[9px] h-[9px] rounded-full bg-white"
              style={{
                boxShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 30px #38bdf8'
              }}
            />
          </div>

          {/* Inner Counter-Spinning Technical Dashed Ring */}
          <div 
            className="absolute inset-2 rounded-full border-[1.5px] border-dashed border-sky-400/30 animate-spin [animation-duration:6s] [animation-timing-function:linear] [animation-direction:reverse]"
          />

          {/* Crisp Pure White Center Logo Pedestal */}
          <div 
            className="relative z-10 w-[76px] h-[76px] rounded-[1.15rem] bg-white p-[7px] flex items-center justify-center transition-transform duration-300 hover:scale-105"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 25px rgba(56, 189, 248, 0.25)'
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

        {/* Title & ( VMS ) Badge */}
        <h1 className="text-[1.45rem] font-black tracking-tight text-white flex items-center justify-center flex-wrap gap-2 mb-6">
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #ffffff 40%, #bae6fd 100%)',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            Visitor Management System
          </span>
          <span 
            className="inline-block px-2.5 py-0.5 rounded-lg font-mono text-[0.85rem] font-extrabold tracking-wider"
            style={{
              background: 'rgba(6, 182, 212, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
            }}
          >
            ( VMS )
          </span>
        </h1>

        {/* Sleek Glowing Wave Progress Bar */}
        <div className="w-full max-w-[240px]">
          <div 
            className="h-[5px] w-full rounded-full overflow-hidden relative"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div 
              className="h-full w-full rounded-full animate-[vmsBar_2s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #00f0ff 50%, #818cf8 80%, transparent 100%)',
                filter: 'drop-shadow(0 0 6px #00f0ff)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Embedded CSS Keyframes for Smooth Loading Movement */}
      <style>{`
        @keyframes vmsBar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(20%);
          }
          100% {
            transform: translateX(110%);
          }
        }
      `}</style>
    </div>
  );
}
