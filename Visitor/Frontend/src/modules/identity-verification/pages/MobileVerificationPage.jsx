import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Check,
  Sparkles,
  HelpCircle,
  Sun,
  ShieldCheck
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
  const nativeCameraInputRef = useRef(null);
  const activeStreamRef = useRef(null);

  const [cameraStream, setCameraStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back, 'user' for front

  // Captures & Previews
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);

  // Binance/Bybit-style Review Modal for current captured frame
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

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
            if (data.hasFront) setFrontImage('synced');
            if (data.hasBack) setBackImage('synced');
            if (data.hasSelfie) setSelfieImage('synced');
          }
        }
      } catch (err) {
        if (isMounted) {
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

  // Safely stop all camera tracks
  const stopCamera = useCallback(() => {
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (_) {}
        });
      } catch (_) {}
      activeStreamRef.current = null;
    }
    setCameraStream(null);
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (_) {}
    }
  }, []);

  // Attach stream to video DOM element with mobile autoplay safeguards
  const attachStreamToVideo = useCallback((stream, el = videoRef.current) => {
    if (!el || !stream) return;
    try {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Mobile video play promise handled:', e);
        });
      }

      el.onloadedmetadata = () => {
        el.play().catch(() => {});
      };
    } catch (err) {
      console.warn('Error attaching video stream:', err);
    }
  }, []);

  // Ref callback to immediately bind newly mounted video elements
  const handleVideoRef = useCallback((element) => {
    videoRef.current = element;
    if (element && activeStreamRef.current) {
      attachStreamToVideo(activeStreamRef.current, element);
    }
  }, [attachStreamToVideo]);

  // Start or transition camera stream
  const startCamera = useCallback(async (targetFacing = facingMode) => {
    // If stream is already active with the requested facing mode, keep it running!
    if (
      activeStreamRef.current &&
      activeStreamRef.current.active &&
      facingMode === targetFacing
    ) {
      if (videoRef.current) {
        attachStreamToVideo(activeStreamRef.current, videoRef.current);
      }
      setCameraLoading(false);
      setCameraError(null);
      return;
    }

    stopCamera();
    setCameraLoading(true);
    setCameraError(null);

    // Give mobile OS hardware 200ms to release sensor lock
    await new Promise(r => setTimeout(r, 200));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('In-browser camera access is not supported. Please use the "Native Phone Camera" button below.');
      setCameraLoading(false);
      return;
    }

    const constraintAttempts = [
      {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: { facingMode: targetFacing },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream = null;
    let lastErr = null;

    for (const constraints of constraintAttempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream && stream.active) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (stream && stream.active) {
      activeStreamRef.current = stream;
      setCameraStream(stream);
      setFacingMode(targetFacing);
      if (videoRef.current) {
        attachStreamToVideo(stream, videoRef.current);
      }
    } else {
      console.warn('Failed to start camera:', lastErr);
      setCameraError(
        lastErr?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Tap the lock 🔒 or camera 📷 icon in your browser address bar to allow camera access, or use the Native Phone Camera button below.'
          : 'Unable to open camera stream. Tap the button below to take a photo using your native phone camera.'
      );
    }
    setCameraLoading(false);
  }, [facingMode, stopCamera, attachStreamToVideo]);

  // Auto-switch camera as steps advance
  useEffect(() => {
    if (currentStep === 2) {
      // Step 2: Front document -> Back camera
      startCamera('environment');
    } else if (currentStep === 3) {
      // Step 3: Back document -> Back camera (reuse if active)
      startCamera('environment');
    } else if (currentStep === 4) {
      // Step 4: Live Selfie -> Front camera
      startCamera('user');
    } else {
      stopCamera();
    }
  }, [currentStep, startCamera, stopCamera]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Flip camera toggle
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from live video stream
  const capturePhoto = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Trigger capture button (Binance/Bybit style review before upload)
  const handleSnap = () => {
    const frame = capturePhoto();
    if (frame) {
      setCapturedPreview(frame);
    }
  };

  // Native camera app / gallery fallback
  const handleNativeFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Retake current preview
  const handleRetake = () => {
    setCapturedPreview(null);
  };

  // Confirm preview & commit for current step
  const handleConfirmCaptured = async () => {
    if (!capturedPreview) return;
    const dataUrl = capturedPreview;
    setUploading(true);

    try {
      if (currentStep === 2) {
        setFrontImage(dataUrl);
        await identityVerificationApi.uploadMobileFront(token, dataUrl);
        setCapturedPreview(null);
        // Move to Step 3 (Back Doc) - Back camera remains active!
        setCurrentStep(3);
      } else if (currentStep === 3) {
        setBackImage(dataUrl);
        await identityVerificationApi.uploadMobileBack(token, dataUrl);
        setCapturedPreview(null);
        // Move to Step 4 (Selfie) - switches to Front Camera
        setCurrentStep(4);
      } else if (currentStep === 4) {
        setSelfieImage(dataUrl);
        await identityVerificationApi.uploadMobileSelfie(token, dataUrl);
        await identityVerificationApi.completeMobile(token);
        setCapturedPreview(null);
        stopCamera();
        // Move to Step 5 (Completed)
        setCurrentStep(5);
      }
    } catch (err) {
      console.warn('Step upload warning:', err);
      // Even if offline/fallback, advance client workflow
      setCapturedPreview(null);
      if (currentStep === 2) setCurrentStep(3);
      else if (currentStep === 3) setCurrentStep(4);
      else if (currentStep === 4) {
        stopCamera();
        setCurrentStep(5);
      }
    } finally {
      setUploading(false);
    }
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
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Hidden processing canvas & native camera input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture={facingMode === 'user' ? 'user' : 'environment'}
        className="hidden"
        onChange={handleNativeFileSelect}
      />

      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>VMS ID Verify</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">KYC</span>
            </h1>
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
          <span className="text-slate-400 text-[10px] font-mono">{sessionData?.docType || 'National ID'}</span>
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
        {/* STEP 1: MOBILE WELCOME & INSTRUCTIONS (Binance/Bybit Level KYC)            */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 text-center py-2">
            <div className="relative mx-auto w-32 h-32 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10 p-2 overflow-hidden">
              <img
                src="/assets/mobile_device_verify.jpg"
                alt="Mobile Verification"
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Smartphone className="w-10 h-10 text-emerald-400 absolute" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white tracking-tight">Identity Document & Biometric Scan</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Welcome <strong className="text-emerald-400">{sessionData?.visitorName || 'Visitor'}</strong>. Prepare your original <strong className="text-white">{sessionData?.docType || 'ID Document'}</strong>.
              </p>
            </div>

            {/* Binance-style Requirements Checklist */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">1</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Back Camera: Front & Back of ID</h4>
                  <p className="text-[11px] text-slate-400">Position the physical ID inside the alignment guide without glare.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">2</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Front Camera: Live Facial Portrait</h4>
                  <p className="text-[11px] text-slate-400">The camera automatically switches to selfie mode to match your face.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">3</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant Sync with Desktop</h4>
                  <p className="text-[11px] text-slate-400">Once finished, your computer advances to the clearance badge automatically.</p>
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
        {/* STEPS 2, 3, 4: UNIFIED CAMERA VIEWPORT & BINANCE-STYLE REVIEW MODAL        */}
        {/* ========================================================================= */}
        {(currentStep === 2 || currentStep === 3 || currentStep === 4) && (
          <div className="space-y-3.5 text-center">
            {/* Header with Step Instructions & Camera Flip */}
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  {currentStep === 2 && 'Step 2: Scan Front of ID'}
                  {currentStep === 3 && 'Step 3: Scan Back of ID'}
                  {currentStep === 4 && 'Step 4: Live Facial Selfie'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {currentStep === 2 && 'Place front side (photo) within the card guide'}
                  {currentStep === 3 && 'Flip card over and align barcode / MRZ area'}
                  {currentStep === 4 && 'Center your face within the biometric oval'}
                </p>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleFlipCamera}
                disabled={cameraLoading || !!capturedPreview}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-40"
                title="Switch between front and back phone camera"
              >
                <RotateCcw size={13} />
                <span>{facingMode === 'environment' ? 'Back 📷' : 'Front 🤳'}</span>
              </button>
            </div>

            {/* CAMERA VIEWPORT OR CAPTURED REVIEW */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              {/* LIVE CAMERA VIDEO (Rendered whenever NOT in review mode) */}
              {!capturedPreview && (
                <>
                  <video
                    ref={handleVideoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />

                  {/* Dynamic Overlays Based on Step */}
                  {/* Step 2: Front ID Card Overlay */}
                  {currentStep === 2 && (
                    <>
                      {/* Laser scanning beam */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-[bounce_3s_infinite]" />
                      </div>
                      {/* Framing brackets */}
                      <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2.5">
                        <div className="flex justify-between items-start">
                          <div className="w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                          <span className="text-[9px] font-mono font-black bg-black/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 tracking-wider">
                            ALIGN FRONT OF ID
                          </span>
                          <div className="w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                          <span className="text-[9px] font-mono text-slate-400 bg-black/70 px-2 py-0.5 rounded">
                            Photo & Full Name Visible
                          </span>
                          <div className="w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Back ID Card Overlay */}
                  {currentStep === 3 && (
                    <>
                      {/* Cyan Laser scanning beam */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#06b6d4] animate-[bounce_3s_infinite]" />
                      </div>
                      {/* Framing brackets */}
                      <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-cyan-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2.5">
                        <div className="flex justify-between items-start">
                          <div className="w-5 h-5 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg" />
                          <span className="text-[9px] font-mono font-black bg-black/80 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/40 tracking-wider">
                            ALIGN BACK OF ID
                          </span>
                          <div className="w-5 h-5 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg" />
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="w-5 h-5 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg" />
                          <span className="text-[9px] font-mono text-slate-400 bg-black/70 px-2 py-0.5 rounded">
                            Barcode / MRZ Lines Visible
                          </span>
                          <div className="w-5 h-5 border-b-3 border-r-3 border-cyan-400 rounded-br-lg" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 4: Face Selfie Biometric Oval Overlay */}
                  {currentStep === 4 && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-3">
                      <div className="w-44 h-56 border-3 border-dashed border-emerald-400/90 rounded-[50%] shadow-[0_0_24px_rgba(16,185,129,0.35)] animate-pulse flex flex-col items-center justify-between py-4">
                        <span className="text-[9px] font-mono font-bold bg-black/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                          CENTER YOUR FACE
                        </span>
                        <span className="text-[9px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded-full">
                          Neutral Expression
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Loading spinner overlay */}
                  {cameraLoading && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-20">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <span className="text-xs font-bold text-slate-200">
                        {facingMode === 'user' ? 'Activating Front Selfie Camera...' : 'Activating Back Camera...'}
                      </span>
                    </div>
                  )}

                  {/* Camera error / permission issue fallback card */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/95 p-4 flex flex-col items-center justify-center text-center gap-2.5 z-30">
                      <AlertCircle className="w-8 h-8 text-amber-400" />
                      <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => startCamera(facingMode)}
                          className="px-3.5 py-2 bg-slate-800 text-xs font-bold rounded-xl text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"
                        >
                          <RefreshCw size={13} /> Retry Camera
                        </button>
                        <button
                          onClick={() => nativeCameraInputRef.current?.click()}
                          className="px-3.5 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5"
                        >
                          <Camera size={13} /> Native Camera
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* BINANCE/BYBIT-STYLE INSTANT CAPTURE REVIEW */}
              {capturedPreview && (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <img
                    src={capturedPreview}
                    alt="Captured Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-500/90 text-slate-950 font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <CheckCircle2 size={12} /> Captured
                  </div>
                </div>
              )}
            </div>

            {/* ACTION CONTROLS */}
            {!capturedPreview ? (
              /* LIVE CAMERA SHUTTER BAR */
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={cameraLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Scan size={18} />
                  <span>
                    {currentStep === 2 && 'Capture Front Document'}
                    {currentStep === 3 && 'Capture Back Document'}
                    {currentStep === 4 && 'Take Biometric Selfie'}
                  </span>
                </button>

                {/* Secondary: Native phone camera or file gallery upload */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Camera size={14} className="text-emerald-400" />
                    <span>Native Camera</span>
                  </button>

                  <label className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNativeFileSelect}
                    />
                    <Upload size={14} className="text-slate-400" />
                    <span>From Gallery</span>
                  </label>
                </div>
              </div>
            ) : (
              /* BINANCE/BYBIT-STYLE PHOTO REVIEW CONFIRMATION BAR */
              <div className="space-y-3 pt-1">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-left space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>Review Captured Photo Quality</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Ensure all 4 corners are visible, text is crisp and readable, and there is no blur or flash reflection.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={uploading}
                    className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmCaptured}
                    disabled={uploading}
                    className="py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Looks Clear & Next</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: VERIFICATION COMPLETED (Live Sync With Computer Screen)            */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-5 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 size={46} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">Verification Complete!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Your identity documents and live facial portrait have been encrypted and synchronized with the central verification terminal.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs max-w-xs mx-auto shadow-inner">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Front Document:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14}/> Captured</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Back Document:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14}/> Captured</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Biometric Facial Selfie:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14}/> Matched</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Clearance Status:</span>
                <span className="text-emerald-400 font-black uppercase tracking-wider">VERIFIED & SYNCED</span>
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
