import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, ShieldAlert } from 'lucide-react';
export default function QRCodeVerification({ onRefresh, onDownload }) {
    const [timeLeft, setTimeLeft] = useState(7170); // 01:59:30 in seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    return (<div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-6 max-w-md mx-auto shadow-2xl space-y-6 text-center">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
          Dashboard &gt; My Visitor Pass &gt; QR Code
        </span>
        <h2 className="text-lg font-extrabold text-white mb-0">Your QR Code for Check-In</h2>
      </div>

      {/* QR Code Container Box */}
      <div className="bg-white p-6 rounded-2xl max-w-[260px] mx-auto shadow-xl border border-slate-700 space-y-2">
        {/* SVG QR Code Simulation */}
        <svg className="w-full h-auto text-slate-900 mx-auto" viewBox="0 0 100 100" fill="currentColor">
          <path d="M0,0 h30 v30 h-30 z M5,5 h20 v20 h-20 z M10,10 h10 v10 h-10 z"/>
          <path d="M70,0 h30 v30 h-30 z M75,5 h20 v20 h-20 z M80,10 h10 v10 h-10 z"/>
          <path d="M0,70 h30 v30 h-30 z M5,75 h20 v20 h-20 z M10,80 h10 v10 h-10 z"/>
          <rect x="40" y="5" width="20" height="10"/>
          <rect x="40" y="20" width="10" height="20"/>
          <rect x="55" y="35" width="15" height="15"/>
          <rect x="15" y="40" width="20" height="10"/>
          <rect x="70" y="55" width="25" height="15"/>
          <rect x="40" y="70" width="15" height="25"/>
          <rect x="60" y="75" width="35" height="20"/>
        </svg>
      </div>

      {/* Countdown Timer Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl max-w-[280px] mx-auto">
        <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5">This QR code will be used for check-in.</span>
        <div className="d-flex align-items-center justify-content-center gap-2">
          <span className="text-xs font-extrabold text-slate-300">Valid until:</span>
          <span className="font-mono text-base font-black text-emerald-400">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row g-2 pt-2">
        <div className="col-6">
          <button onClick={onRefresh} className="w-100 btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 rounded-xl d-flex align-items-center justify-content-center gap-1.5 transition-all">
            <RefreshCw className="h-3.5 w-3.5 text-blue-400"/> Refresh QR Code
          </button>
        </div>
        <div className="col-6">
          <button onClick={onDownload} className="w-100 btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 rounded-xl d-flex align-items-center justify-content-center gap-1.5 transition-all">
            <Download className="h-3.5 w-3.5 text-emerald-400"/> Download QR
          </button>
        </div>
      </div>

      {/* Footnote Notice */}
      <p className="text-[10px] text-slate-500 font-semibold mb-0 d-flex align-items-center justify-content-center gap-1">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-500"/> Note: QR code will be active only during the appointment time.
      </p>
    </div>);
}
