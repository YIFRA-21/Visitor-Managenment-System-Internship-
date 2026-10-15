import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Copy, AlertTriangle, RefreshCw, Camera, Upload, Check, UserCheck, ShieldCheck, FileText } from 'lucide-react';
import { departmentsApi, employeesApi, roomsApi, appointmentsApi, getErrorMessage } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';
const steps = ['Visitor Info', 'Identity Verification', 'Host & Purpose', 'Schedule', 'Review'];
const visitTypes = [
    { value: 'customer', label: 'Customer / Client' },
    { value: 'partner', label: 'Partner' },
    { value: 'investor', label: 'Investor' },
    { value: 'vendor', label: 'Vendor / Supplier' },
    { value: 'government', label: 'Government' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'other', label: 'Other' },
];
const docTypesList = [
    { key: 'National ID', label: 'National ID', desc: 'Double-sided ID card' },
    { key: 'Passport', label: 'Passport', desc: 'Main photo bio page' },
    { key: 'Driver License', label: 'Driver\'s License', desc: 'Double-sided license card' },
    { key: 'Other', label: 'Other Document', desc: 'Any official document' },
];
export default function BookAppointmentPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [suggestedSlots, setSuggestedSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    // Form main states — auto-populated from logged-in visitor
    const [form, setForm] = useState({
        visitorName: user?.fullName || '',
        visitorEmail: user?.email || '',
        visitorPhone: '',
        company: '',
        departmentId: '',
        hostId: '',
        roomId: '',
        purpose: '',
        visitType: 'customer',
        date: '',
        startTime: '10:00',
        endTime: '11:00',
    });
    // Identity Verification sub-states
    const [verificationType, setVerificationType] = useState('National ID');
    const [verificationStep, setVerificationStep] = useState(0); // 0: select doc, 1: upload docs, 2: face scan, 3: matching, 4: results
    const [idNumber, setIdNumber] = useState('');
    const [frontDoc, setFrontDoc] = useState(null);
    const [backDoc, setBackDoc] = useState(null);
    const [visitorSelfie, setVisitorSelfie] = useState(null);
    const [uploadingFront, setUploadingFront] = useState(false);
    const [uploadingBack, setUploadingBack] = useState(false);
    const [uploadingSelfie, setUploadingSelfie] = useState(false);
    // Scans simulation
    const [scanningFront, setScanningFront] = useState(false);
    const [scanningBack, setScanningBack] = useState(false);
    // Biometrics checks
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [matchingPercent, setMatchingPercent] = useState(0);
    const [matchingProgress, setMatchingProgress] = useState([]);
    const [verificationResult, setVerificationResult] = useState(null);
    const [simulateVerificationError, setSimulateVerificationError] = useState(false);
    const [identityVerified, setIdentityVerified] = useState(false);
    const [livenessChallengeIndex, setLivenessChallengeIndex] = useState(0); // 0: Smile, 1: Turn Head, 2: Blink, 3: Completed
    const [livenessProgress, setLivenessProgress] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(null);
    const challengeIndexRef = useRef(0);
    // Camera settings
    const videoRef = useRef(null);
    const [streamActive, setStreamActive] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const streamRef = useRef(null);
    // AI Face Detection Settings
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const animationFrameIdRef = useRef(null);
    const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
    const loadDepartments = async () => {
        if (departments.length)
            return;
        try {
            const res = await departmentsApi.list();
            setDepartments(res.data);
        }
        catch (err) {
            console.error(err);
        }
    };
    const loadEmployees = async (deptId) => {
        try {
            const res = await departmentsApi.employees(parseInt(deptId));
            setEmployees(res.data);
        }
        catch (err) {
            console.error(err);
        }
    };
    const loadRooms = async () => {
        if (rooms.length)
            return;
        try {
            const res = await roomsApi.list();
            setRooms(res.data);
        }
        catch (err) {
            console.error(err);
        }
    };
    const loadAvailability = async () => {
        if (!form.hostId || !form.date)
            return;
        try {
            const res = await employeesApi.availability(parseInt(form.hostId), form.date);
            setSuggestedSlots(res.data.suggestedSlots || []);
        }
        catch (err) {
            console.error(err);
        }
    };
    // Document uploader helper with client-side validation and compression
    const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
        return new Promise((resolve) => {
            if (file.type === 'application/pdf') {
                resolve(file);
                return;
            }
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxWidth / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    resolve(blob ? new File([blob], file.name, { type: file.type }) : file);
                }, file.type, quality);
            };
            img.onerror = () => resolve(file);
            img.src = URL.createObjectURL(file);
        });
    };
    const handleDocFrontUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setError('');
        setUploadingFront(true);
        try {
            const compressed = await compressImage(file);
            const res = await appointmentsApi.uploadFront(compressed);
            setFrontDoc({ fileName: res.data.fileName, fileUrl: res.data.fileUrl });
            setScanningFront(true);
            setTimeout(() => setScanningFront(false), 2000);
        }
        catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }
        finally {
            setUploadingFront(false);
        }
    };
    const handleDocBackUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setError('');
        setUploadingBack(true);
        try {
            const compressed = await compressImage(file);
            const res = await appointmentsApi.uploadBack(compressed);
            setBackDoc({ fileName: res.data.fileName, fileUrl: res.data.fileUrl });
            setScanningBack(true);
            setTimeout(() => setScanningBack(false), 2000);
        }
        catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }
        finally {
            setUploadingBack(false);
        }
    };
    // Camera management with detailed error handling
    const startCamera = async () => {
        setCameraError(false);
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            setStreamActive(true);
            // Avoid deadlock by waiting for the rendering cycle to complete and element to be in DOM
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch((err) => console.error('Video playback failed', err));
                }
            }, 50);
        }
        catch (err) {
            console.error('Camera access failed', err);
            setCameraError(true);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
            }
            else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('No camera found on this device. Please use the manual photo upload option.');
            }
            else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError('Camera is in use by another application. Please close other apps using the camera.');
            }
            else if (!navigator.mediaDevices || location.protocol !== 'https:' && location.hostname !== 'localhost') {
                setError('Camera requires HTTPS. Please access this site over a secure connection.');
            }
            else {
                setError('Camera unavailable. Please use the manual photo upload option.');
            }
        }
    };
    const loadModels = async () => {
        const faceapi = window.faceapi;
        if (!faceapi) {
            console.error('face-api.js is not loaded from CDN.');
            return;
        }
        if (modelsLoaded || isModelLoading)
            return;
        setIsModelLoading(true);
        try {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
            ]);
            setModelsLoaded(true);
            console.log('AI models loaded successfully');
        }
        catch (err) {
            console.error('Failed to load AI models', err);
        }
        finally {
            setIsModelLoading(false);
        }
    };
    // Continuous frame processing loop
    useEffect(() => {
        const faceapi = window.faceapi;
        if (!streamActive || !modelsLoaded || !videoRef.current || !faceapi) {
            setFaceDetected(false);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            return;
        }
        const video = videoRef.current;
        let isProcessing = false;
        const getVal = (p, coord) => {
            if (!p)
                return 0;
            return p[coord] !== undefined ? p[coord] : p[`_${coord}`] || 0;
        };
        const dist = (p1, p2) => {
            const x1 = getVal(p1, 'x');
            const y1 = getVal(p1, 'y');
            const x2 = getVal(p2, 'x');
            const y2 = getVal(p2, 'y');
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        };
        const detectFrame = async () => {
            if (video.paused || video.ended || isProcessing) {
                animationFrameIdRef.current = requestAnimationFrame(detectFrame);
                return;
            }
            isProcessing = true;
            try {
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })).withFaceLandmarks();
                setFaceDetected(!!detection);
                if (detection && challengeIndexRef.current < 3) {
                    const positions = detection.landmarks.positions;
                    if (positions && positions.length >= 68) {
                        // challengeIndexRef.current maps: 0: Smile, 1: Turn Head, 2: Blink, 3: Completed
                        if (challengeIndexRef.current === 0) {
                            // Smile Challenge: Mouth corners (48, 54) relative to outer eye corners (36, 45)
                            const mouthWidth = dist(positions[48], positions[54]);
                            const eyeWidth = dist(positions[36], positions[45]);
                            const smileRatio = mouthWidth / (eyeWidth || 1);
                            const progress = Math.min(Math.round(((smileRatio - 0.35) / 0.12) * 100), 100);
                            setLivenessProgress(Math.max(0, progress));
                            if (smileRatio > 0.45) {
                                challengeIndexRef.current = 1;
                                setLivenessChallengeIndex(1);
                                setLivenessProgress(0);
                            }
                        }
                        else if (challengeIndexRef.current === 1) {
                            // Head Turn: Nose tip (30) relative to jaw margins (0, 16)
                            const noseX = getVal(positions[30], 'x');
                            const jawLeftX = getVal(positions[0], 'x');
                            const jawRightX = getVal(positions[16], 'x');
                            const leftDist = Math.abs(noseX - jawLeftX);
                            const rightDist = Math.abs(jawRightX - noseX);
                            const offsetRatio = leftDist / (rightDist || 1);
                            const dev = Math.abs(offsetRatio - 1.0);
                            const progress = Math.min(Math.round((dev / 0.6) * 100), 100);
                            setLivenessProgress(progress);
                            if (offsetRatio < 0.6 || offsetRatio > 1.7) {
                                challengeIndexRef.current = 2;
                                setLivenessChallengeIndex(2);
                                setLivenessProgress(0);
                            }
                        }
                        else if (challengeIndexRef.current === 2) {
                            // Blink: Eye Aspect Ratio (EAR) for left (36-41) and right (42-47)
                            const earLeft = (dist(positions[37], positions[41]) + dist(positions[38], positions[40])) / (2 * dist(positions[36], positions[39]));
                            const earRight = (dist(positions[43], positions[47]) + dist(positions[44], positions[46])) / (2 * dist(positions[42], positions[45]));
                            const averageEAR = (earLeft + earRight) / 2;
                            const dev = 0.28 - averageEAR;
                            const progress = Math.min(Math.round((dev / 0.12) * 100), 100);
                            setLivenessProgress(Math.max(0, progress));
                            if (averageEAR < 0.18) {
                                challengeIndexRef.current = 3;
                                setLivenessChallengeIndex(3);
                                setLivenessProgress(100);
                                setTimeout(() => {
                                    capturePhoto();
                                }, 500);
                            }
                        }
                    }
                }
            }
            catch (err) {
                console.error('Error during face detection frame processing', err);
            }
            finally {
                isProcessing = false;
                animationFrameIdRef.current = requestAnimationFrame(detectFrame);
            }
        };
        detectFrame();
        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
        };
    }, [streamActive, modelsLoaded]);
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setStreamActive(false);
    };
    const capturePhoto = async () => {
        if (!videoRef.current)
            return;
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 400, 400);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setVisitorSelfie(dataUrl);
            stopCamera();
            // Upload the captured selfie to backend before running biometric matching
            setUploadingSelfie(true);
            try {
                const res = await appointmentsApi.uploadSelfieBase64(dataUrl);
                const uploadedUrl = res.data.fileUrl;
                setVisitorSelfie(uploadedUrl);
                runBiometricMatching(uploadedUrl);
            }
            catch (err) {
                console.error('Selfie upload failed, using local data URL for matching', err);
                // Fallback: use local dataUrl for matching even if upload fails
                runBiometricMatching(dataUrl);
            }
            finally {
                setUploadingSelfie(false);
            }
        }
    };
    const captureSimulatedPhoto = () => {
        challengeIndexRef.current = 3;
        setLivenessChallengeIndex(3);
        setLivenessProgress(100);
        if (frontDoc) {
            setVisitorSelfie(frontDoc.fileUrl);
            runBiometricMatching(frontDoc.fileUrl);
        }
        else {
            const fallbackUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
            setVisitorSelfie(fallbackUrl);
            runBiometricMatching(fallbackUrl);
        }
    };
    const handleSelfieUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setError('');
        setUploadingSelfie(true);
        try {
            const compressed = await compressImage(file);
            const res = await appointmentsApi.uploadSelfie(compressed);
            setVisitorSelfie(res.data.fileUrl);
            challengeIndexRef.current = 3;
            setLivenessChallengeIndex(3);
            setLivenessProgress(100);
            runBiometricMatching(res.data.fileUrl);
        }
        catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }
        finally {
            setUploadingSelfie(false);
        }
    };
    const runBiometricMatching = async (selfieUrl) => {
        setVerificationStep(3); // Matching simulation
        setIsAnalyzing(true);
        setMatchingPercent(0);
        setMatchingProgress([]);
        const logs = [
            'Locating facial zone in document image...',
            'Mapping 68 distinct facial landmark keypoints...',
            'Calculating spatial nose-to-eye ratios...',
            'Running liveness index correlation verification...',
            'Analyzing structural bone dimensions against target selfie...',
            'Computing matching vector confidence score...'
        ];
        // Seed a mock card OCR number
        const randomSerial = `${verificationType.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        setIdNumber(randomSerial);
        for (let i = 0; i < logs.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setMatchingProgress((prev) => [...prev, `[SYS] ${logs[i]}`]);
            setMatchingPercent((prev) => Math.min(Math.floor((i + 1) * (100 / logs.length)), 90));
        }
        try {
            const emailForVerify = simulateVerificationError ? 'fail@visitor.com' : form.visitorEmail;
            const res = await appointmentsApi.verifyIdentity({
                visitorEmail: emailForVerify,
                idImageUrl: frontDoc ? frontDoc.fileUrl : 'mock_id.png',
                selfieImage: selfieUrl
            });
            const { similarity, status } = res.data;
            setMatchingPercent(similarity);
            setVerificationResult(status === 'failed' ? 'error' : 'success');
            setIdentityVerified(status !== 'failed');
        }
        catch (err) {
            console.error(err);
            const axErr = err;
            const similarity = axErr.response?.data?.similarity || 74.20;
            setMatchingPercent(similarity);
            setVerificationResult('error');
            setIdentityVerified(false);
            setError(getErrorMessage(err));
            const count = attempts + 1;
            setAttempts(count);
            if (axErr.response?.data?.lockedUntil) {
                setLockedUntil(axErr.response?.data?.lockedUntil);
            }
            else if (count >= 3) {
                setLockedUntil(new Date(Date.now() + 15 * 60 * 1000).toISOString());
            }
        }
        finally {
            setIsAnalyzing(false);
            setVerificationStep(4); // Results display
        }
    };
    const resetVerification = () => {
        stopCamera();
        setFrontDoc(null);
        setBackDoc(null);
        setVisitorSelfie(null);
        setIdNumber('');
        setIdentityVerified(false);
        setVerificationResult(null);
        setVerificationStep(0);
        setError('');
        setLivenessChallengeIndex(0);
        setLivenessProgress(0);
        challengeIndexRef.current = 0;
    };
    const nextStep = async () => {
        setError('');
        // Step 0: Visitor Info
        if (step === 0) {
            if (!form.visitorName || !form.visitorEmail || !form.visitorPhone) {
                setError('Please fill in Name, Email and Phone number');
                return;
            }
        }
        // Step 1: Identity Verification check
        if (step === 1) {
            if (!identityVerified) {
                setError('You must complete Identity Verification to proceed.');
                return;
            }
            await loadDepartments();
        }
        // Step 2: Host & Purpose
        if (step === 2) {
            await loadRooms();
            if (!form.departmentId || !form.hostId || !form.purpose) {
                setError('Please fill in Department, Host Representative and Purpose of visit');
                return;
            }
        }
        // Step 3: Date & Schedule
        if (step === 3) {
            if (!form.date || !form.startTime) {
                setError('Please select date and start time');
                return;
            }
            await loadAvailability();
        }
        setStep((s) => s + 1);
    };
    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            const scheduledStart = `${form.date} ${form.startTime}:00`;
            const scheduledEnd = `${form.date} ${form.endTime}:00`;
            const res = await appointmentsApi.create({
                visitorName: form.visitorName,
                visitorEmail: form.visitorEmail,
                visitorPhone: form.visitorPhone,
                company: form.company,
                idType: verificationType,
                idNumber: idNumber || 'VERIFIED-ID',
                hostId: parseInt(form.hostId),
                departmentId: parseInt(form.departmentId),
                roomId: form.roomId ? parseInt(form.roomId) : null,
                purpose: form.purpose,
                visitType: form.visitType,
                scheduledStart,
                scheduledEnd,
                document: frontDoc, // Links the verified ID document to the appointment
                verificationStatus: matchingPercent >= 90 ? 'verified' : (matchingPercent >= 80 ? 'manual_review' : 'failed'),
                similarityScore: matchingPercent
            });
            const appointmentResult = res.data.data || res.data;
            setSuccess({ referenceCode: appointmentResult.referenceCode, qrDataUrl: appointmentResult.qrDataUrl });
        }
        catch (err) {
            const axiosErr = err;
            const msg = axiosErr.response?.data?.error || 'Failed to submit appointment';
            const slots = axiosErr.response?.data?.suggestedSlots;
            setError(slots?.length ? `${msg}. Try: ${slots.join(', ')}` : msg);
            setStep(3); // bounce back to scheduler step
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);
    useEffect(() => {
        if (verificationStep === 2) {
            const timer = setTimeout(() => {
                startCamera();
                loadModels();
            }, 100);
            return () => clearTimeout(timer);
        }
        else {
            stopCamera();
        }
    }, [verificationStep]);
    if (success) {
        return (<div className="flex min-h-screen items-center justify-center bg-[#070b13] p-6 relative overflow-hidden font-mono text-slate-200">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none"/>
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none"/>
        
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg card text-center overflow-hidden relative">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-8 w-8"/>
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Request Logged</h2>
          <p className="mt-2 text-xs text-slate-400">Your pass has been scheduled and is pending approval.</p>
          
          <div className="mt-6 rounded-lg bg-[#05080e] border border-slate-800 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Reference Code</p>
            <p className="text-2xl font-bold tracking-widest text-cyan-400 font-mono mt-1">{success.referenceCode}</p>
            <button onClick={() => navigator.clipboard.writeText(success.referenceCode)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition">
              <Copy className="h-4 w-4"/> Copy Reference
            </button>
          </div>
          {success.qrDataUrl && (<div className="mt-6 flex justify-center">
              <div className="p-3 bg-white rounded-2xl relative shadow-md">
                <img src={success.qrDataUrl} alt="QR Pass" className="h-40 w-40 rounded-xl"/>
              </div>
            </div>)}
          <div className="mt-8 flex gap-3 justify-center">
            <Link to={`/track?ref=${success.referenceCode}`} className="btn-primary">
              Track Status
            </Link>
            <Link to="/" className="btn-secondary">Home</Link>
          </div>
        </motion.div>
      </div>);
    }
    return (<DashboardLayout>
    <div className="min-h-screen flex flex-col bg-[#070b13] text-slate-100 font-mono relative overflow-hidden">
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .laser-scanner {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(34, 211, 238, 0.85);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.9);
          animation: scanLine 2s linear infinite;
        }
        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(34, 211, 238, 0.3); }
          50% { border-color: rgba(34, 211, 238, 0.85); }
        }
        .camera-pulse-border {
          animation: pulseBorder 2s infinite;
        }
      `}</style>

      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-900/5 blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none"/>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15 pointer-events-none"/>


      <div className="flex-1 mx-auto w-full max-w-3xl px-6 pt-8 pb-12 relative z-10">
        
        {/* Stepper indicator */}
        <div className="mb-8 flex justify-between">
          {steps.map((s, i) => (<div key={s} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold font-mono transition duration-300 ${i <= step
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-[#05080e] border border-slate-800 text-slate-500'}`}>
                {i + 1}
              </div>
              <span className={`ml-2.5 hidden text-[10px] font-bold uppercase tracking-widest sm:inline ${i <= step ? 'text-cyan-400' : 'text-slate-500'}`}>
                {s}
              </span>
              {i < steps.length - 1 && (<div className={`mx-4 h-0.5 flex-1 ${i < step ? 'bg-cyan-500/50' : 'bg-slate-800'}`}/>)}
            </div>))}
        </div>

        <div className="card">
          {error && (<div className="mb-5 rounded-lg border border-red-500/20 bg-red-950/25 p-4 text-xs text-red-400 font-semibold">&gt; {error}</div>)}

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {/* STEP 0: VISITOR INFO */}
              {step === 0 && (<div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="sm:col-span-2">
                    <label className="label">Full Name *</label>
                    <input className="input" placeholder="Enter full name" value={form.visitorName} onChange={(e) => update('visitorName', e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input type="email" className="input" placeholder="email@company.com" value={form.visitorEmail} onChange={(e) => update('visitorEmail', e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input className="input" placeholder="+2519/09" value={form.visitorPhone} onChange={(e) => update('visitorPhone', e.target.value)}/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Company / Organization</label>
                    <input className="input" placeholder="Company name" value={form.company} onChange={(e) => update('company', e.target.value)}/>
                  </div>
                </div>)}

              {/* STEP 1: IDENTITY VERIFICATION WIZARD */}
              {step === 1 && (<div className="pt-2">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-900 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Secure Biometric Verification</h3>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase">Perform ID scanning and face matching</p>
                    </div>
                    {/* Test simulator toggle */}
                    <div className="flex items-center gap-2">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer" htmlFor="sim-toggle">
                        Simulate Mismatch
                      </label>
                      <input type="checkbox" id="sim-toggle" checked={simulateVerificationError} onChange={(e) => setSimulateVerificationError(e.target.checked)} className="rounded border-slate-800 bg-[#05080e] text-cyan-400 focus:ring-0 cursor-pointer h-4 w-4"/>
                    </div>
                  </div>

                  {lockedUntil ? (<div className="space-y-4 text-center max-w-md mx-auto py-6">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-950/20 border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <AlertTriangle className="h-8 w-8 animate-bounce"/>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">Verification Locked</h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Too many failed attempts (3/3)</p>
                      </div>
                      <p className="text-xs text-slate-400">Your email has been temporarily locked out of the identity verification system to prevent spoofing. Please try again after 15 minutes.</p>
                      <button type="button" onClick={() => {
                    if (new Date(lockedUntil) <= new Date()) {
                        setLockedUntil(null);
                        setAttempts(0);
                        resetVerification();
                    }
                    else {
                        setError("Still locked. Please wait for the lockout period to end.");
                    }
                }} className="btn-primary w-full">
                        Check Lock Status
                      </button>
                    </div>) : (<>
                      {/* Wizard Verification Step Router */}
                      {verificationStep === 0 && (<div className="space-y-4">
                      <p className="text-xs text-slate-400 text-center mb-6">Select an identification method to begin document scanning.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {docTypesList.map((d) => (<button key={d.key} type="button" onClick={() => {
                            setVerificationType(d.key);
                            setVerificationStep(1);
                        }} className="flex flex-col items-left text-left p-4 rounded-xl border border-slate-800 bg-[#05080e] hover:border-cyan-500/50 hover:bg-[#070d19] transition-all duration-300 group">
                            <span className="text-cyan-400 group-hover:text-cyan-300 font-bold text-xs uppercase tracking-wider">{d.label}</span>
                            <span className="text-[10px] text-slate-500 mt-1">{d.desc}</span>
                          </button>))}
                      </div>
                    </div>)}

                  {verificationStep === 1 && (<div className="space-y-5">
                      <div className="flex justify-between items-center text-xs bg-[#05080e] border border-slate-900 rounded-lg p-3">
                        <span className="text-slate-400">Selected Type: <strong className="text-cyan-400 uppercase">{verificationType}</strong></span>
                        <button type="button" onClick={() => setVerificationStep(0)} className="text-[10px] text-slate-500 hover:text-cyan-400 underline uppercase tracking-wider">Change Type</button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Front Face Upload */}
                        <div className="flex flex-col">
                          <label className="label uppercase text-[10px] tracking-wider mb-2">ID Document Front side *</label>
                          <div className="flex-1 flex flex-col justify-center items-center rounded-lg border border-dashed border-slate-800 bg-[#05080e] p-5 text-center relative overflow-hidden min-h-[160px]">
                            {scanningFront && <div className="laser-scanner"/>}
                            {frontDoc ? (<div className="space-y-3">
                                <img src={frontDoc.fileUrl} alt="ID Front Preview" className="h-20 max-w-xs mx-auto rounded object-cover border border-slate-800"/>
                                <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
                                  <Check className="h-3 w-3"/> Scan Complete
                                </div>
                              </div>) : (<div className="space-y-2">
                                <FileText className="mx-auto h-8 w-8 text-slate-600 animate-pulse"/>
                                <div className="flex text-[10px] text-slate-400 justify-center">
                                  <label className="relative cursor-pointer rounded bg-transparent font-bold text-cyan-400 hover:text-cyan-300">
                                    <span>Upload Front face</span>
                                    <input type="file" className="sr-only" onChange={handleDocFrontUpload} accept="image/*"/>
                                  </label>
                                </div>
                                <p className="text-[8px] text-slate-600 uppercase">PNG, JPG up to 5MB</p>
                              </div>)}
                            {uploadingFront && <p className="absolute bottom-2 text-[9px] text-cyan-400 animate-pulse">Uploading file...</p>}
                          </div>
                        </div>

                        {/* Back Face Upload (hidden for Passport) */}
                        {verificationType !== 'Passport' ? (<div className="flex flex-col">
                            <label className="label uppercase text-[10px] tracking-wider mb-2">ID Document Back side *</label>
                            <div className="flex-1 flex flex-col justify-center items-center rounded-lg border border-dashed border-slate-800 bg-[#05080e] p-5 text-center relative overflow-hidden min-h-[160px]">
                              {scanningBack && <div className="laser-scanner"/>}
                              {backDoc ? (<div className="space-y-3">
                                  <img src={backDoc.fileUrl} alt="ID Back Preview" className="h-20 max-w-xs mx-auto rounded object-cover border border-slate-800"/>
                                  <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
                                    <Check className="h-3 w-3"/> Scan Complete
                                  </div>
                                </div>) : (<div className="space-y-2">
                                  <FileText className="mx-auto h-8 w-8 text-slate-600 animate-pulse"/>
                                  <div className="flex text-[10px] text-slate-400 justify-center">
                                    <label className="relative cursor-pointer rounded bg-transparent font-bold text-cyan-400 hover:text-cyan-300">
                                      <span>Upload Back face</span>
                                      <input type="file" className="sr-only" onChange={handleDocBackUpload} accept="image/*"/>
                                    </label>
                                  </div>
                                  <p className="text-[8px] text-slate-600 uppercase">PNG, JPG up to 5MB</p>
                                </div>)}
                              {uploadingBack && <p className="absolute bottom-2 text-[9px] text-cyan-400 animate-pulse">Uploading file...</p>}
                            </div>
                          </div>) : (<div className="flex flex-col justify-center items-center border border-slate-900 bg-[#04080e]/40 p-5 rounded-lg text-slate-500 text-center">
                            <ShieldCheck className="h-8 w-8 text-cyan-500/20 mb-2"/>
                            <p className="text-[10px] uppercase tracking-wider font-bold">Passport Scan Mode</p>
                            <p className="text-[9px] text-slate-600 mt-1 max-w-[200px]">Passports only require a single scan of the primary photo bio page.</p>
                          </div>)}
                      </div>

                      {/* Advance to Face Scan step when document uploads are done */}
                      <div className="pt-4 flex justify-end">
                        <button type="button" disabled={!frontDoc || (verificationType !== 'Passport' && !backDoc)} onClick={() => {
                        setVerificationStep(2);
                    }} className="btn-primary disabled:opacity-40">
                          Scan Face <Camera className="h-4 w-4"/>
                        </button>
                      </div>
                    </div>)}

                  {verificationStep === 2 && (<div className="space-y-4 flex flex-col items-center">
                      <p className="text-xs text-slate-400 text-center max-w-md">Position your face inside the circle frame and select check scanner options below.</p>
                      
                      {/* Model Loading Status */}
                      {isModelLoading && (<div className="flex items-center gap-2 text-cyan-400 animate-pulse text-[10px] uppercase font-bold tracking-wider bg-cyan-950/20 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin"/> Downloading AI Models...
                        </div>)}
                      {modelsLoaded && !isModelLoading && (<div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1 bg-emerald-950/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                          <ShieldCheck className="h-3.5 w-3.5"/> Biometric AI Active
                        </div>)}

                      <div className={`relative h-60 w-60 rounded-full border-2 bg-[#03060a] flex items-center justify-center overflow-hidden transition-all duration-300 ${faceDetected
                        ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'border-cyan-500/40 camera-pulse-border'}`}>
                        
                        {/* Always render video to resolve the React Ref deadlock, control visibility via class */}
                        {!cameraError && (<video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover scale-x-[-1] ${streamActive ? 'block' : 'hidden'}`} playsInline/>)}

                        {/* Scanner overlay beam when active */}
                        {streamActive && !cameraError && (<div className="laser-scanner"/>)}

                        {(!streamActive || cameraError) && (<div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/20">
                            {/* Scanning beam animation */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(6,182,212,0.1),transparent)] bg-[size:100%_40px] animate-pulse"/>
                            <UserCheck className="h-12 w-12 text-cyan-400/40 mb-2 animate-bounce"/>
                            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                              {cameraError ? 'Camera Access Failed' : 'Webcam Ready'}
                            </p>
                            <p className="text-[8px] text-slate-500 uppercase tracking-widest text-center mt-1 max-w-[170px]">
                              {cameraError ? 'Please check camera permissions' : 'Click Initialize Camera to start real scanning'}
                            </p>
                          </div>)}

                        {/* Guideline Target Ring overlay */}
                        <div className={`absolute inset-4 rounded-full border transition-colors duration-300 pointer-events-none flex items-center justify-center ${faceDetected ? 'border-emerald-500/30' : 'border-cyan-500/10'}`}>
                          <div className={`h-6 w-6 border-t border-l absolute top-0 left-0 transition-colors duration-300 ${faceDetected ? 'border-emerald-400' : 'border-cyan-400/40'}`}/>
                          <div className={`h-6 w-6 border-t border-r absolute top-0 right-0 transition-colors duration-300 ${faceDetected ? 'border-emerald-400' : 'border-cyan-400/40'}`}/>
                          <div className={`h-6 w-6 border-b border-l absolute bottom-0 left-0 transition-colors duration-300 ${faceDetected ? 'border-emerald-400' : 'border-cyan-400/40'}`}/>
                          <div className={`h-6 w-6 border-b border-r absolute bottom-0 right-0 transition-colors duration-300 ${faceDetected ? 'border-emerald-400' : 'border-cyan-400/40'}`}/>
                        </div>
                      </div>
                      
                      {/* Liveness Challenges UI */}
                      {streamActive && !cameraError && (<div className="w-full max-w-sm mt-3 border border-cyan-500/20 bg-cyan-950/10 p-3 rounded-lg flex flex-col items-center">
                          <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-2">Biometric Liveness Verification</p>
                          
                          {/* Challenges indicator icons */}
                          <div className="flex gap-4 mb-3">
                            <div className={`flex items-center gap-1 text-[9px] uppercase font-bold ${livenessChallengeIndex > 0 ? 'text-emerald-400' : (livenessChallengeIndex === 0 ? 'text-cyan-400' : 'text-slate-600')}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${livenessChallengeIndex > 0 ? 'bg-emerald-400' : (livenessChallengeIndex === 0 ? 'bg-cyan-400 animate-ping' : 'bg-slate-600')}`}/>
                              Smile
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] uppercase font-bold ${livenessChallengeIndex > 1 ? 'text-emerald-400' : (livenessChallengeIndex === 1 ? 'text-cyan-400' : 'text-slate-600')}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${livenessChallengeIndex > 1 ? 'bg-emerald-400' : (livenessChallengeIndex === 1 ? 'bg-cyan-400 animate-ping' : 'bg-slate-600')}`}/>
                              Head Turn
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] uppercase font-bold ${livenessChallengeIndex > 2 ? 'text-emerald-400' : (livenessChallengeIndex === 2 ? 'text-cyan-400' : 'text-slate-600')}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${livenessChallengeIndex > 2 ? 'bg-emerald-400' : (livenessChallengeIndex === 2 ? 'bg-cyan-400 animate-ping' : 'bg-slate-600')}`}/>
                              Blink
                            </div>
                          </div>

                          {/* Current Challenge Instruction */}
                          <div className="text-center font-bold text-slate-100 text-xs mb-1.5 animate-pulse min-h-[16px]">
                            {livenessChallengeIndex === 0 && "👉 Show a big smile for the camera!"}
                            {livenessChallengeIndex === 1 && "👉 Turn your head left or right!"}
                            {livenessChallengeIndex === 2 && "👉 Blink your eyes!"}
                            {livenessChallengeIndex === 3 && "✅ Liveness check successful!"}
                          </div>

                          {/* Challenge Progress Bar */}
                          {livenessChallengeIndex < 3 && (<div className="w-full bg-slate-900/60 rounded-full h-1.5 border border-cyan-500/10 overflow-hidden">
                              <div className="bg-cyan-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]" style={{ width: `${livenessProgress}%` }}/>
                            </div>)}
                        </div>)}

                      <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center items-center">
                        {streamActive ? (<div className="flex flex-col items-center gap-3">
                            {faceDetected ? (<span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1 rounded">
                                <ShieldCheck className="h-3.5 w-3.5"/> Face Detected & Aligned
                              </span>) : (<span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-amber-950/20 border border-amber-500/20 px-2.5 py-1 rounded">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin"/> Align Face inside Ring
                              </span>)}
                            <button type="button" onClick={capturePhoto} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition ${faceDetected
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                            : 'bg-cyan-950/40 text-cyan-400/50 border border-cyan-400/10 cursor-not-allowed opacity-50'}`} disabled={!faceDetected}>
                              <Camera className="h-4 w-4"/> Capture Photo
                            </button>
                          </div>) : (<>
                            <button type="button" onClick={startCamera} className="btn-secondary flex items-center gap-1.5">
                              <RefreshCw className="h-3.5 w-3.5"/> Initialize Camera
                            </button>
                            <button type="button" onClick={captureSimulatedPhoto} className="bg-cyan-950/40 hover:bg-cyan-950/60 text-cyan-400 border border-cyan-400/30 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition">
                              <UserCheck className="h-4 w-4"/> Simulate Face Capture
                            </button>
                          </>)}
                        
                        {/* File upload fallback */}
                        <div className="relative">
                          <label className="btn-secondary inline-flex items-center gap-1.5 cursor-pointer">
                            <Upload className="h-3.5 w-3.5"/> Upload Face Photo
                            <input type="file" className="sr-only" onChange={handleSelfieUpload} accept="image/*"/>
                          </label>
                          {uploadingSelfie && <span className="text-[8px] text-cyan-400 animate-pulse absolute -bottom-4 left-0">Uploading selfie...</span>}
                        </div>
                      </div>
                    </div>)}

                  {verificationStep === 3 && (<div className="space-y-6 max-w-md mx-auto py-4">
                      <div className="text-center space-y-2">
                        <RefreshCw className="mx-auto h-8 w-8 text-cyan-400 animate-spin"/>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">Running Biometric Scan Check</h4>
                        <p className="text-[9px] text-slate-500 uppercase">Analysis rating: {matchingPercent}% match index</p>
                      </div>

                      {/* Visual scanning overlay preview */}
                      <div className="flex justify-center items-center gap-6 bg-[#04080e] p-4 rounded-xl border border-slate-900">
                        <div className="relative h-24 w-24 rounded border border-slate-800 overflow-hidden bg-[#03060a]">
                          {frontDoc && <img src={frontDoc.fileUrl} alt="ID comparison" className="h-full w-full object-cover"/>}
                          <div className="laser-scanner"/>
                        </div>
                        <span className="text-xs font-bold text-cyan-400 animate-pulse">&lt;&gt;</span>
                        <div className="relative h-24 w-24 rounded-full border border-slate-800 overflow-hidden bg-[#03060a]">
                          {visitorSelfie && <img src={visitorSelfie} alt="Selfie comparison" className="h-full w-full object-cover"/>}
                          <div className="laser-scanner"/>
                        </div>
                      </div>

                      {/* Process Logs Box */}
                      <div className="bg-[#030509] border border-slate-900 rounded p-3 text-[9px] font-mono text-cyan-400/70 h-28 overflow-y-auto space-y-1">
                        {matchingProgress.map((log, idx) => (<div key={idx} className="truncate">{log}</div>))}
                      </div>
                    </div>)}

                  {verificationStep === 4 && (<div className="pt-2 text-center max-w-md mx-auto space-y-6">
                      {verificationResult === 'success' ? (<div className="space-y-4">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400">
                            <ShieldCheck className="h-8 w-8"/>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identity Verified Successfully</h3>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase">Facial recognition score: {matchingPercent}% (Required &gt;= 85%)</p>
                          </div>

                          <div className="bg-[#05080e] border border-slate-900 rounded-lg p-4 text-left text-xs space-y-2.5">
                            <div className="flex justify-between border-b border-slate-900 pb-1.5">
                              <span className="text-slate-500 uppercase text-[9px] font-bold">Verification ID</span>
                              <span className="text-cyan-400 font-bold">{idNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-900 pb-1.5">
                              <span className="text-slate-500 uppercase text-[9px] font-bold">Document Type</span>
                              <span className="text-slate-300 font-bold uppercase">{verificationType}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                              <span className="text-slate-500 uppercase text-[9px] font-bold">Biometrics Status</span>
                              <span className="text-emerald-400 font-bold uppercase">MATCHED & SECURED</span>
                            </div>
                          </div>

                          <button type="button" onClick={nextStep} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.25)] transition flex items-center justify-center gap-1">
                            Proceed to host details <ArrowRight className="h-4 w-4"/>
                          </button>
                        </div>) : (<div className="space-y-4">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-950/20 border border-red-500/20 text-red-400">
                            <AlertTriangle className="h-8 w-8"/>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verification Mismatch</h3>
                            <p className="text-[10px] text-red-400 mt-1 uppercase font-semibold">Security Code: mismatch-confidence {matchingPercent}%</p>
                          </div>
                          <p className="text-[10px] text-slate-400">The face matching algorithms detected a landmark configuration difference between the ID document photo and captured selfie. Please retry.</p>
                          
                          {simulateVerificationError && (<div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 text-[9px] text-cyan-400 text-left">
                               <span className="font-bold">Tip:</span> "Simulate Mismatch" is checked in the top right. Uncheck it and retry the capture/upload to simulate a successful match.
                             </div>)}

                          <button type="button" onClick={resetVerification} className="bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-1">
                            <RefreshCw className="h-4 w-4 animate-spin"/> Retry Scan Verification
                          </button>
                        </div>)}
                    </div>)}
                </>)}
            </div>)}

              {/* STEP 2: HOST & PURPOSE */}
              {step === 2 && (<div className="grid gap-4 pt-2">
                  <div>
                    <label className="label">Target Department *</label>
                    <select className="input" value={form.departmentId} onChange={(e) => {
                update('departmentId', e.target.value);
                update('hostId', '');
                loadEmployees(e.target.value);
            }}>
                      <option value="">Select department</option>
                      {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Host Representative / Sponsor *</label>
                    <select className="input" value={form.hostId} onChange={(e) => update('hostId', e.target.value)}>
                      <option value="">Select host</option>
                      {(Array.isArray(employees) ? employees : []).map((e) => (<option key={e.id} value={e.id}>{e.full_name} — {e.job_title}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Visit Classification Type</label>
                    <select className="input" value={form.visitType} onChange={(e) => update('visitType', e.target.value)}>
                      {visitTypes.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Purpose of Visit *</label>
                    <textarea className="input min-h-[100px]" placeholder="Briefly describe the purpose of your appointment..." value={form.purpose} onChange={(e) => update('purpose', e.target.value)}/>
                  </div>
                </div>)}

              {/* STEP 3: SCHEDULE */}
              {step === 3 && (<div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="sm:col-span-2">
                    <label className="label">Meeting Room Allocation (optional)</label>
                    <select className="input" value={form.roomId} onChange={(e) => update('roomId', e.target.value)}>
                      <option value="">No room allocation required</option>
                      {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name} — {r.location}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date *</label>
                    <input type="date" className="input" value={form.date} onChange={(e) => update('date', e.target.value)} min={new Date().toISOString().split('T')[0]}/>
                  </div>
                  <div>
                    <label className="label">Start Time *</label>
                    <input type="time" className="input" value={form.startTime} onChange={(e) => update('startTime', e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">End Time *</label>
                    <input type="time" className="input" value={form.endTime} onChange={(e) => update('endTime', e.target.value)}/>
                  </div>
                  {suggestedSlots.length > 0 && (<div className="sm:col-span-2 mt-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested available slots:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedSlots.map((slot) => (<button key={slot} type="button" onClick={() => update('startTime', slot)} className="rounded bg-cyan-950/20 border border-cyan-400/30 hover:border-cyan-400 px-3.5 py-1 text-xs font-bold text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all duration-200">
                            {slot}
                          </button>))}
                      </div>
                    </div>)}
                </div>)}

              {/* STEP 4: REVIEW */}
              {step === 4 && (<div className="space-y-3.5 text-xs pt-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Registry Preview</p>
                    <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/> Identity Secured
                    </span>
                  </div>
                  {[
                ['Name', form.visitorName],
                ['Email', form.visitorEmail],
                ['Phone', form.visitorPhone],
                ['Company', form.company || '—'],
                ['Purpose', form.purpose],
                ['Date', form.date],
                ['Time', `${form.startTime} - ${form.endTime}`],
                ['Verification Document', `${verificationType} (${idNumber})`],
            ].map(([label, val]) => (<div key={label} className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">{label}</span>
                      <span className="font-bold text-slate-200">{val}</span>
                    </div>))}
                </div>)}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between border-t border-slate-900 pt-6">
            {step > 0 ? (<button onClick={() => {
                if (step === 1) {
                    resetVerification();
                }
                setStep((s) => s - 1);
            }} className="btn-secondary">
                <ArrowLeft className="h-4 w-4"/> Back
              </button>) : (<div />)}
            {step < 4 ? (
        // Hide Next on the Identity Verification step unless verification succeeded
        (step === 1 && !identityVerified) ? null : (<button onClick={nextStep} className="btn-primary">
                  Next <ArrowRight className="h-4 w-4"/>
                </button>)) : (<button onClick={submit} disabled={loading} className="btn-primary">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>)}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>);
}
