import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  Trash2,
  Shield,
  Camera,
  RefreshCw,
  ArrowLeftRight,
  Sparkles,
  X,
  Scan,
  AlertTriangle
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import { useToast } from '../../../contexts/ToastContext';

export default function DocumentCapturePage() {
  const { caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const caseState = location.state || {};
  const docType = caseState.docType || 'NATIONAL_ID';
  const country = caseState.country || 'Ethiopia';
  const isPassport = docType === 'PASSPORT';

  // Front & Back state
  const [frontFile, setFrontFile] = useState(caseState.frontFile || null);
  const [frontPreview, setFrontPreview] = useState(caseState.frontPreview || null);
  const [backFile, setBackFile] = useState(caseState.backFile || null);
  const [backPreview, setBackPreview] = useState(caseState.backPreview || null);

  // Orientation / Inversion warning
  const [inversionWarning, setInversionWarning] = useState(false);

  // Camera modal state
  const [cameraActiveSide, setCameraActiveSide] = useState(null); // 'front' | 'back' | null
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);

  // Error message
  const [error, setError] = useState('');

  // Auto-detect if Front and Back might be swapped
  useEffect(() => {
    if (!frontPreview || !backPreview) {
      setInversionWarning(false);
      return;
    }

    const analyzeImages = async () => {
      try {
        const checkHasFaceOrQr = async (imgUrl) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 160;
                canvas.height = 100;
                ctx.drawImage(img, 0, 0, 160, 100);
                const data = ctx.getImageData(0, 0, 160, 100).data;
                
                // Heuristic analysis: Calculate high-frequency black-and-white variance (QR codes)
                let highContrastPixels = 0;
                let darkPixels = 0;
                let totalSampled = 0;
                for (let i = 0; i < data.length; i += 16) {
                  const r = data[i], g = data[i + 1], b = data[i + 2];
                  const brightness = (r + g + b) / 3;
                  if (brightness < 60) darkPixels++;
                  if (brightness < 40 || brightness > 220) highContrastPixels++;
                  totalSampled++;
                }

                const qrLikelihood = (highContrastPixels / totalSampled);
                resolve({ qrLikelihood });
              } catch (e) {
                resolve({ qrLikelihood: 0.5 });
              }
            };
            img.onerror = () => resolve({ qrLikelihood: 0.5 });
            img.src = imgUrl;
          });
        };

        const [frontMetrics, backMetrics] = await Promise.all([
          checkHasFaceOrQr(frontPreview),
          checkHasFaceOrQr(backPreview)
        ]);

        // If front has significantly higher QR code density than back, suggest swap
        if (frontMetrics.qrLikelihood > backMetrics.qrLikelihood + 0.12) {
          setInversionWarning(true);
        } else {
          setInversionWarning(false);
        }
      } catch (err) {
        console.warn('Analysis skipped:', err);
      }
    };

    analyzeImages();
  }, [frontPreview, backPreview]);

  // Handle Swap Front and Back
  const handleSwapSides = () => {
    const tempFile = frontFile;
    const tempPreview = frontPreview;

    setFrontFile(backFile);
    setFrontPreview(backPreview);

    setBackFile(tempFile);
    setBackPreview(tempPreview);

    setInversionWarning(false);
    toast.success('Front and Back images swapped successfully!');
  };

  // File Upload Handlers
  const handleFrontUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be under 15MB.');
        return;
      }
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleBackUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be under 15MB.');
        return;
      }
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Camera Management
  const startCamera = async (side) => {
    setCameraActiveSide(side);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActiveSide(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = `${cameraActiveSide}_document_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      if (cameraActiveSide === 'front') {
        setFrontFile(file);
        setFrontPreview(previewUrl);
      } else {
        setBackFile(file);
        setBackPreview(previewUrl);
      }

      toast.success(`${cameraActiveSide === 'front' ? 'Front' : 'Back'} photo captured!`);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Proceed to Biometric Liveness Face Scan
  const handleProceed = () => {
    if (!frontFile) {
      setError('Please provide a photo or scan of the front of your document.');
      return;
    }
    if (!isPassport && !backFile) {
      setError('Please provide the back side of your ID card.');
      return;
    }

    navigate(`/identity-verification/biometric/${caseId}`, {
      state: {
        ...caseState,
        caseId,
        frontFile,
        backFile,
        frontPreview,
        backPreview,
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
        <BackButton />
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-white">Capture Identity Document</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {docType.replace('_', ' ')} • {country}
            </span>
          </div>
          <p className="text-xs text-slate-400">Step 2 of 3: Provide clear Front & Back photos via file upload or live camera.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inversion Warning Banner (When Back was uploaded as Front) */}
      {inversionWarning && (
        <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Possible Inverted Document Detected</p>
              <p className="text-[11px] text-amber-300/80">
                The Front slot appears to contain the Back side (QR code/address), and the Back slot contains the Portrait photo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSwapSides}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shrink-0 shadow transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap Front & Back Now</span>
          </button>
        </div>
      )}

      {/* Guidelines Box */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-300">
        <div className="flex items-center space-x-2 font-bold text-white">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Identification Orientation Guide</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Front Side:</strong> Must contain the portrait photo, full name, nationality & card emblem.</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <FileText className="w-4 h-4 text-sky-400 shrink-0" />
            <span><strong>Back Side:</strong> Contains the QR verification code, barcode, residential address & phone.</span>
          </div>
        </div>
      </div>

      {/* Manual Swap Button */}
      {!isPassport && (frontPreview || backPreview) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSwapSides}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swap Front & Back</span>
          </button>
        </div>
      )}

      {/* Document Upload Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front Side */}
        <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                Front Side {isPassport ? '(Photo Page)' : '(Portrait Photo Side)'}
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Required
            </span>
          </div>

          {frontPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center group">
              <img
                src={frontPreview}
                alt="Document Front"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => startCamera('front')}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition"
                  title="Retake with Camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFrontFile(null);
                    setFrontPreview(null);
                  }}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-950/40 aspect-video space-y-4">
              <div className="flex flex-col items-center text-center">
                <UploadCloud className="w-8 h-8 text-slate-500 mb-1" />
                <p className="text-xs font-bold text-slate-300">Provide Front Photo</p>
                <p className="text-[10px] text-slate-500">Ensure the portrait face is clearly visible</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => startCamera('front')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Use Camera</span>
                </button>

                <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition flex items-center space-x-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFrontUpload}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Back Side (if applicable) */}
        {!isPassport && (
          <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Back Side (QR & Address Side)</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                Required
              </span>
            </div>

            {backPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center group">
                <img
                  src={backPreview}
                  alt="Document Back"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => startCamera('back')}
                    className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg transition"
                    title="Retake with Camera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBackFile(null);
                      setBackPreview(null);
                    }}
                    className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-950/40 aspect-video space-y-4">
                <div className="flex flex-col items-center text-center">
                  <UploadCloud className="w-8 h-8 text-slate-500 mb-1" />
                  <p className="text-xs font-bold text-slate-300">Provide Back Photo</p>
                  <p className="text-[10px] text-slate-500">Ensure the QR code and barcode are sharp</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => startCamera('back')}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Use Camera</span>
                  </button>

                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition flex items-center space-x-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleBackUpload}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Automated Extraction Assurance Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900/90 via-[#0c1527] to-slate-900/90 border border-slate-800 rounded-3xl flex items-center space-x-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold text-white">
              Automated Document Data Extraction
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              Instant AI OCR
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All identification attributes (Full Name, Document Number/FIN, Date of Birth, Expiration Date, and Issuing Jurisdiction) will be extracted and securely stored directly from your inserted document images.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
        <button
          onClick={() => navigate('/identity-verification/select-document')}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
        >
          Back
        </button>
        <button
          onClick={handleProceed}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center space-x-1.5"
        >
          <span>Continue to Live Face Scan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Card Camera Modal */}
      {cameraActiveSide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Align {cameraActiveSide === 'front' ? 'Front Side' : 'Back Side'} Within Guide Frame
                </h3>
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
                <p>{cameraError}</p>
                <button
                  onClick={stopCamera}
                  className="px-4 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Close & Upload File Instead
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* ID Card Rectangle Guide Overlay */}
                <div className="absolute inset-8 sm:inset-12 border-2 border-emerald-400/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
                    <span>CARD FRAME</span>
                    <span>16:9 ID</span>
                  </div>
                  <div className="text-center text-[10px] text-emerald-300 font-semibold bg-slate-950/70 py-1 px-2 rounded-lg self-center">
                    {cameraActiveSide === 'front'
                      ? 'Place photo & name inside frame'
                      : 'Place QR code & barcode inside frame'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={Boolean(cameraError)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/30 transition flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture {cameraActiveSide === 'front' ? 'Front' : 'Back'} Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
