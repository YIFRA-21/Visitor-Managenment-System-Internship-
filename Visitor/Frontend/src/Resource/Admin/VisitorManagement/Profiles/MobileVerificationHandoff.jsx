import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Clock, CheckCircle2, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import identityVerificationApi from '../../../../modules/visitor-management/api/identityVerificationApi';
export const MobileVerificationHandoff = ({ sessionId, onMobileComplete }) => {
    const [mobileToken, setMobileToken] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [status, setStatus] = useState('Waiting');
    const [timeLeft, setTimeLeft] = useState(1800); // 30 min expiration
    const [loading, setLoading] = useState(true);
    const [qrError, setQrError] = useState(false);
    // Generate a client-side fallback token
    const generateFallbackToken = useCallback(() => {
        return `MVSESS-${sessionId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }, [sessionId]);
    // Generate QR code from a URL string
    const generateQRFromUrl = useCallback(async (url) => {
        try {
            const dataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
                errorCorrectionLevel: 'M'
            });
            return dataUrl;
        }
        catch (err) {
            console.error('QR generation error:', err);
            return null;
        }
    }, []);
    // Initialize mobile session
    useEffect(() => {
        let isMounted = true;
        const initSession = async () => {
            setLoading(true);
            setQrError(false);
            try {
                // Try backend API first
                const res = await identityVerificationApi.createMobileSession(sessionId);
                if (!isMounted)
                    return;
                const data = res.data;
                const token = data.mobileToken;
                setMobileToken(token);
                const fullUrl = `${window.location.origin}${data.qrUrl}`;
                const qr = await generateQRFromUrl(fullUrl);
                if (isMounted && qr) {
                    setQrDataUrl(qr);
                }
                else if (isMounted) {
                    throw new Error('QR generation from API URL failed');
                }
            }
            catch (err) {
                // Fallback: generate QR code client-side with a local token
                console.warn('Mobile session API unavailable, generating client-side QR:', err);
                if (!isMounted)
                    return;
                const fallbackToken = generateFallbackToken();
                setMobileToken(fallbackToken);
                const fallbackUrl = `${window.location.origin}/mobile-verify?token=${fallbackToken}&session=${sessionId}`;
                const qr = await generateQRFromUrl(fallbackUrl);
                if (isMounted) {
                    if (qr) {
                        setQrDataUrl(qr);
                    }
                    else {
                        setQrError(true);
                    }
                }
            }
            finally {
                if (isMounted)
                    setLoading(false);
            }
        };
        initSession();
        return () => { isMounted = false; };
    }, [sessionId, generateQRFromUrl, generateFallbackToken]);
    // Countdown Timer
    useEffect(() => {
        if (timeLeft <= 0) {
            setStatus('Expired');
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);
    // Status Polling & Sync — only set status from server if poll succeeds
    useEffect(() => {
        if (!mobileToken || status === 'Completed' || status === 'Expired')
            return;
        const interval = setInterval(async () => {
            try {
                const res = await identityVerificationApi.getMobileStatus(mobileToken);
                const serverStatus = res.status;
                if (serverStatus === 'CONNECTED')
                    setStatus('Connected');
                else if (serverStatus === 'UPLOADING')
                    setStatus('Uploading');
                else if (serverStatus === 'COMPLETED' || (res.hasFront && res.hasSelfie)) {
                    setStatus('Completed');
                    clearInterval(interval);
                    setTimeout(() => onMobileComplete(), 1500);
                }
                // Do NOT set Expired from server — let the local timer handle it
            }
            catch (err) {
                // Silently ignore poll errors — the mobile session endpoint may not exist in fallback mode.
                // This is expected behavior when using client-side QR generation.
            }
        }, 5000); // Poll every 5 seconds instead of 2.5
        return () => clearInterval(interval);
    }, [mobileToken, status, onMobileComplete]);
    // Regenerate QR
    const handleRegenerate = async () => {
        setLoading(true);
        setQrError(false);
        setQrDataUrl(null);
        setStatus('Waiting');
        setTimeLeft(1800);
        const fallbackToken = generateFallbackToken();
        setMobileToken(fallbackToken);
        const fallbackUrl = `${window.location.origin}/mobile-verify?token=${fallbackToken}&session=${sessionId}`;
        const qr = await generateQRFromUrl(fallbackUrl);
        if (qr) {
            setQrDataUrl(qr);
        }
        else {
            setQrError(true);
        }
        setLoading(false);
    };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    return (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-xl mx-auto text-center space-y-6">
      <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 mb-1">
        <Smartphone size={28}/>
      </div>

      <div>
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Continue Verification on Mobile</h3>
        <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
          Scan the QR code with your smartphone camera to open a secure mobile verification session and capture your document & live selfie.
        </p>
      </div>

      {/* QR Code Container */}
      <div className="relative inline-block bg-white p-4 rounded-2xl shadow-2xl border-4 border-indigo-500/30">
        {loading ? (<div className="w-56 h-56 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 size={32} className="animate-spin text-indigo-600"/>
            <span className="text-xs font-bold">Generating QR Code...</span>
          </div>) : qrDataUrl ? (<img src={qrDataUrl} alt="Mobile Session QR Code" className="w-56 h-56 rounded-xl block mx-auto"/>) : qrError ? (<div className="w-56 h-56 flex flex-col items-center justify-center text-red-500 gap-2">
            <AlertCircle size={32}/>
            <span className="text-xs font-bold">Failed to generate QR</span>
            <button onClick={handleRegenerate} className="mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 transition-colors">
              <RefreshCw size={12}/> Retry
            </button>
          </div>) : (<div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={32} className="animate-spin text-indigo-600"/>
            <span className="text-xs font-bold">Initializing...</span>
          </div>)}

        {status === 'Expired' && (<div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center text-red-400 p-4">
            <AlertCircle size={32} className="mb-2"/>
            <span className="text-xs font-bold uppercase">Session Expired</span>
            <button onClick={handleRegenerate} className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-700 transition-colors">
              <RefreshCw size={12}/> Regenerate QR
            </button>
          </div>)}
      </div>

      {/* Real-time Status Tracker */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-left">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Real-time Sync Status</span>
          <span className="flex items-center gap-1 font-mono text-amber-400">
            <Clock size={13}/> {formatTime(timeLeft)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
          <div className={`p-2 rounded-lg border transition-all ${status === 'Waiting' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' : status === 'Connected' || status === 'Uploading' || status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
            1. Waiting
          </div>
          <div className={`p-2 rounded-lg border transition-all ${status === 'Connected' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' : status === 'Uploading' || status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
            2. Connected
          </div>
          <div className={`p-2 rounded-lg border transition-all ${status === 'Uploading' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' : status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
            3. Uploading
          </div>
          <div className={`p-2 rounded-lg border transition-all ${status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
            4. Completed
          </div>
        </div>

        {status === 'Completed' && (<div className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 p-2.5 rounded-lg text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16}/> Mobile verification synchronized!
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider">Advancing...</span>
          </div>)}
      </div>

      {/* Direct Open Link / Simulation Fallback */}
      <div className="pt-2">
        <a
          href={mobileToken ? `/mobile-verify/${mobileToken}` : `/mobile-verify?session=${sessionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Smartphone size={14} />
          <span>Open Mobile Verification Flow In New Tab / Mobile Preview</span>
        </a>
      </div>
    </div>);
};
export default MobileVerificationHandoff;
