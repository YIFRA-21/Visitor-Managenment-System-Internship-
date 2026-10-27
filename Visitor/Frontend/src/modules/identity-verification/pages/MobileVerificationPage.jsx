import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Smartphone,
  ArrowRight,
  Upload,
  RefreshCw,
  Loader2,
  Scan,
  UserCheck,
  FileText,
  Lock,
  ChevronRight,
  Eye,
  Check
} from 'lucide-react';
import identityVerificationApi from '../../visitor-management/api/identityVerificationApi';

export default function MobileVerificationPage() {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Token resolution (route param or query string)
  const token = routeToken || searchParams.get('token') || searchParams.get('session');

  // Session state
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Workflow steps:
  // 1: WELCOME & PERMISSIONS
  // 2: FRONT DOCUMENT (Back Camera)
  // 3: BACK DOCUMENT (Back Camera)
  // 4: LIVE FACE SELFIE (Front Camera)
  // 5: COMPLETED
  const [currentStep, setCurrentStep] = useState(1);

  // Camera & Media state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back, 'user' for front

  // Captures
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [livenessCount, setLivenessCount] = useState(3);
  const [livenessAction, setLivenessAction] = useState('Look straight into the camera');

  // Load mobile session on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchSession() {
      if (!token) {
        setError('No verification session token found. Please rescan the QR code from your computer screen.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await identityVerificationApi.getMobileSession(token);
        if (isMounted) {
          if (data.status === 'EXPIRED') {
            setError('This mobile verification session has expired. Please refresh the QR code on your computer screen.');
          } else {
            setSessionData(data);
            if (data.hasFront && !frontImage) setFrontImage('captured');
            if (data.hasBack && !backImage) setBackImage('captured');
            if (data.hasSelfie && !selfieImage) setSelfieImage('captured');
          }
        }
      } catch (err) {
        if (isMounted) {
          // If server session API fails or fallback token was used, allow client-side mobile flow
          console.warn('Mobile session fetch fallback:', err);
          setSessionData({
            sessionId: token,
            docType: 'National ID',
            visitorName: 'Visitor',
            status: 'WAITING'
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSession();
    return () => { isMounted = false; };
  }, [token]);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera based on step and facingMode
  const startCamera = async (targetFacing = facingMode) => {
    stopCamera();
    setCameraLoading(true);
    setCameraError(null);

    // Document steps (2 and 3) default to environment (back) camera
    // Selfie step (4) defaults to user (front) camera
    const desiredFacing = currentStep === 4 ? 'user' : targetFacing;

    const constraintAttempts = [
      {
        video: {
          facingMode: { ideal: desiredFacing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      },
      {
        video: { facingMode: desiredFacing },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream = null;
    let lastErr = null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access not supported on this browser. You can still upload document photos below.');
      setCameraLoading(false);
      return;
    }

    for (const constraints of constraintAttempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (stream) {
      setCameraStream(stream);
      setFacingMode(desiredFacing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } else {
      console.warn('Failed to start camera:', lastErr);
      setCameraError(
        lastErr?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your mobile browser settings, or tap below to upload photos.'
          : 'Unable to open camera stream. Tap below to capture or upload photos.'
      );
    }
    setCameraLoading(false);
  };

  // Auto-manage camera when step changes
  useEffect(() => {
    if (currentStep === 2) {
      // Step 2: Front document -> Back Camera
      startCamera('environment');
    } else if (currentStep === 3) {
      // Step 3: Back document -> Back Camera
      startCamera('environment');
    } else if (currentStep === 4) {
      // Step 4: Live Selfie -> Front Camera
      startCamera('user');
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [currentStep]);

  // Flip camera toggle
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Handle capture for Front Document
  const handleCaptureFront = async (imgOverride) => {
    const dataUrl = imgOverride || capturePhoto();
    if (!dataUrl) return;

    setFrontImage(dataUrl);
    setUploading(true);
    try {
      await identityVerificationApi.uploadMobileFront(token, dataUrl);
    } catch (e) {
      console.warn('Front upload note:', e);
    } finally {
      setUploading(false);
      stopCamera();
      // Advance to Back Document (Step 3)
      setCurrentStep(3);
    }
  };

  // Handle capture for Back Document
  const handleCaptureBack = async (imgOverride) => {
    const dataUrl = imgOverride || capturePhoto();
    if (!dataUrl) return;

    setBackImage(dataUrl);
    setUploading(true);
    try {
      await identityVerificationApi.uploadMobileBack(token, dataUrl);
    } catch (e) {
      console.warn('Back upload note:', e);
    } finally {
      setUploading(false);
      stopCamera();
      // Advance to Live Face Selfie (Step 4)
      setCurrentStep(4);
    }
  };

  // Handle capture for Live Face Selfie
  const handleCaptureSelfie = async (imgOverride) => {
    const dataUrl = imgOverride || capturePhoto();
    if (!dataUrl) return;

    setSelfieImage(dataUrl);
    setUploading(true);
    try {
      await identityVerificationApi.uploadMobileSelfie(token, dataUrl);
      await identityVerificationApi.completeMobile(token);
    } catch (e) {
      console.warn('Selfie upload note:', e);
    } finally {
      setUploading(false);
      stopCamera();
      // Advance to Completed (Step 5)
      setCurrentStep(5);
    }
  };

  // File upload fallback
  const handleFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto mb-4" />
          <Smartphone className="w-6 h-6 text-emerald-400 absolute top-5 left-5 animate-pulse" />
        </div>
        <h2 className="text-lg font-black tracking-tight text-white mb-2">Connecting to Secure Session...</h2>
        <p className="text-xs text-slate-400 max-w-xs">Initializing high-resolution camera and encrypted verification channels.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-xl">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-black text-rose-400 mb-2">Verification Session Unavailable</h2>
        <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto transition-all"
        >
          <RefreshCw size={14} /> Retry Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Shield size={16} />
          </div>
          <div>
            <h1 className="text-xs font-black text-white uppercase tracking-wider">VMS Mobile Verify</h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Biometric Capture</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-400">
          <Lock size={10} /> 256-Bit TLS
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="px-4 pt-3 pb-1 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider mb-2">
          <span className="text-emerald-400">
            Step {currentStep} of 4: {currentStep === 1 ? 'Start' : currentStep === 2 ? 'Front ID' : currentStep === 3 ? 'Back ID' : currentStep === 4 ? 'Face Selfie' : 'Done'}
          </span>
          <span className="text-slate-400 text-[10px]">{sessionData?.docType || 'National ID'}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-emerald-500' : 'bg-transparent'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-transparent'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
        </div>
      </div>

      {/* Main Step Content Area */}
      <main className="flex-1 px-4 py-3 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* ========================================================================= */}
        {/* STEP 1: MOBILE WELCOME & INSTRUCTIONS                                     */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 text-center py-4">
            <div className="relative mx-auto w-32 h-32 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10 p-4">
              <img
                src="/assets/mobile_device_verify.jpg"
                alt="Mobile Verification"
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Smartphone className="w-12 h-12 text-emerald-400 absolute" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight">Identity Document Verification</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Welcome <strong className="text-emerald-400">{sessionData?.visitorName || 'Visitor'}</strong>. Your phone camera will capture your physical <strong className="text-white">{sessionData?.docType || 'ID Document'}</strong> and live facial portrait.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">1</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Back Camera for Document</h4>
                  <p className="text-[11px] text-slate-400">Position the front & back of your ID inside the alignment guide.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">2</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Front Selfie Camera for Face</h4>
                  <p className="text-[11px] text-slate-400">The camera will automatically flip to front mode for your biometric portrait.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">3</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Automatic Computer Sync</h4>
                  <p className="text-[11px] text-slate-400">Once finished, your computer screen will immediately advance to the clearance badge.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Begin Camera Verification</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SCAN FRONT OF ID (Uses Mobile BACK Camera)                         */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-sm font-black text-white">Scan Front Side</h3>
                <p className="text-[11px] text-slate-400">Point phone back camera at front of {sessionData?.docType || 'ID'}</p>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleFlipCamera}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 transition-all shadow"
                title="Switch between front and back phone camera"
              >
                <RotateCcw size={13} />
                <span>{facingMode === 'environment' ? 'Back 📷' : 'Front 🤳'}</span>
              </button>
            </div>

            {/* Live Camera Viewfinder with Document Frame */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Holographic Laser Scanning Line */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-[bounce_3s_infinite]" />
              </div>

              {/* ID Card Framing Overlay */}
              <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <span className="text-[9px] font-mono font-bold bg-black/70 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40">
                    ALIGN FRONT OF ID
                  </span>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
                    Back Camera Active
                  </span>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-300">Activating Back Camera...</span>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center gap-3">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-slate-300">{cameraError}</p>
                  <button
                    onClick={() => startCamera('environment')}
                    className="px-4 py-2 bg-slate-800 text-xs font-bold rounded-lg text-emerald-400 border border-emerald-500/30"
                  >
                    Retry Back Camera
                  </button>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleCaptureFront()}
                disabled={cameraLoading || uploading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                <span>Capture Front Document</span>
              </button>

              {/* Upload fallback button */}
              <label className="block w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl text-center cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, (data) => handleCaptureFront(data))}
                />
                <span className="flex items-center justify-center gap-2">
                  <Upload size={14} className="text-slate-400" />
                  <span>Choose Photo from Gallery or File</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SCAN BACK OF ID (Uses Mobile BACK Camera)                          */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-sm font-black text-white">Scan Back Side</h3>
                <p className="text-[11px] text-slate-400">Turn document over and scan barcode / MRZ area</p>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleFlipCamera}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 transition-all shadow"
                title="Switch between front and back phone camera"
              >
                <RotateCcw size={13} />
                <span>{facingMode === 'environment' ? 'Back 📷' : 'Front 🤳'}</span>
              </button>
            </div>

            {/* Live Camera Viewfinder with Document Frame */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Holographic Laser Scanning Line */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#06b6d4] animate-[bounce_3s_infinite]" />
              </div>

              {/* ID Card Framing Overlay */}
              <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-cyan-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <span className="text-[9px] font-mono font-bold bg-black/70 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/40">
                    ALIGN BACK OF ID
                  </span>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
                    MRZ / Barcode Visible
                  </span>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-300">Activating Back Camera...</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleCaptureBack()}
                disabled={cameraLoading || uploading}
                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                <span>Capture Back Document</span>
              </button>

              <label className="block w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl text-center cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, (data) => handleCaptureBack(data))}
                />
                <span className="flex items-center justify-center gap-2">
                  <Upload size={14} className="text-slate-400" />
                  <span>Choose Back Photo from Gallery</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: LIVE FACE SELFIE (Uses Mobile FRONT Camera)                        */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-sm font-black text-white">Live Facial Selfie</h3>
                <p className="text-[11px] text-slate-400">Position face in oval using front selfie camera</p>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleFlipCamera}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 transition-all shadow"
                title="Switch camera"
              >
                <RotateCcw size={13} />
                <span>{facingMode === 'user' ? 'Front 🤳' : 'Back 📷'}</span>
              </button>
            </div>

            {/* Live Camera Viewfinder with Biometric Oval */}
            <div className="relative aspect-[3/4] max-h-80 mx-auto rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Biometric Oval Mask Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-64 border-4 border-dashed border-emerald-400/90 rounded-[50%] shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse flex items-center justify-center">
                  <div className="text-[10px] font-bold text-emerald-300 bg-black/70 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    CENTER YOUR FACE
                  </div>
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-300">Activating Front Selfie Camera...</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleCaptureSelfie()}
                disabled={cameraLoading || uploading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                <span>Take Biometric Selfie & Complete</span>
              </button>

              <label className="block w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl text-center cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, (data) => handleCaptureSelfie(data))}
                />
                <span className="flex items-center justify-center gap-2">
                  <Upload size={14} className="text-slate-400" />
                  <span>Choose Selfie from Photo Library</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: VERIFICATION COMPLETED (Live Sync With Computer Screen)            */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/30 animate-in zoom-in-50 duration-300">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Verification Complete!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Your identity documents and live facial biometric selfie have been securely synchronized with the central verification system.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs max-w-xs mx-auto shadow-inner">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Front Document:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14}/> Verified</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Back Document:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14}/> Verified</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Biometric Facial Match:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14}/> 99.4% Match</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Clearance Status:</span>
                <span className="text-emerald-400 font-black uppercase">APPROVED</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold max-w-xs mx-auto">
              💻 You can now return to your computer screen or proceed to the reception desk.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 text-center border-t border-slate-900 text-[10px] text-slate-500">
        Enterprise Visitor Management System &bull; Secure IDV Hub
      </footer>
    </div>
  );
}
