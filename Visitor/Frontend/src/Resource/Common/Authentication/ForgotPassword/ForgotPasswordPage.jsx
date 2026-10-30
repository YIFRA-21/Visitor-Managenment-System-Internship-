import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Shield,
    CheckCircle,
    Mail,
    Eye,
    EyeOff,
    Lock,
    User as UserIcon,
    KeyRound,
    MessageSquare,
    RefreshCw,
    AlertCircle,
    Smartphone
} from 'lucide-react';
import { authApi } from '../../../../services/api';
import { useOrganization } from '../../../../contexts/OrganizationContext';
import { ValidationRules } from '../../../../services/validationService';
import FieldError from '../../../../components/common/FieldError';

// ─── Password strength checker ──────────────────────────
function checkPasswordStrength(pw) {
    const checks = {
        length: pw.length >= 8,
        cases: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
        number: /\d/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    let level = 'weak';
    if (passed >= 4) level = 'strong';
    else if (passed >= 3) level = 'medium';
    return { checks, level, passed };
}

// ─── Step indicator component ───────────────────────────
function StepIndicator({ current }) {
    const steps = [
        { num: 1, label: 'Identity', icon: UserIcon },
        { num: 2, label: 'Verify Code', icon: KeyRound },
        { num: 3, label: 'New Password', icon: Lock },
        { num: 4, label: 'Complete', icon: CheckCircle },
    ];

    return (
        <div className="flex items-center justify-between mb-8 max-w-sm mx-auto px-2">
            {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = current > step.num;
                const isActive = current === step.num;

                return (
                    <React.Fragment key={step.num}>
                        <div className="flex flex-col items-center z-10">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-md ${
                                    isCompleted
                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20'
                                        : isActive
                                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-indigo-500/30 ring-4 ring-indigo-500/10'
                                        : 'border-slate-800 bg-[#070b13] text-slate-500'
                                }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <StepIcon className="h-4 w-4" />
                                )}
                            </div>
                            <span
                                className={`text-[10px] mt-2 font-extrabold uppercase tracking-wider text-center ${
                                    isCompleted
                                        ? 'text-emerald-400'
                                        : isActive
                                        ? 'text-indigo-400 font-black'
                                        : 'text-slate-500 font-semibold'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div
                                className={`flex-1 h-[2px] mx-2 -mt-5 rounded-full transition-all duration-300 ${
                                    current > step.num ? 'bg-emerald-500' : 'bg-slate-800'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Main Forgot Password Page ──────────────────────────
export default function ForgotPasswordPage() {
    const location = useLocation();
    const initialPassed = location.state?.identifier || '';
    const { logoUrl, orgName, orgEmail, orgPhone } = useOrganization();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [demoToken, setDemoToken] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const clearFieldError = (field) =>
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });

    // Step 1 state
    const [identifyMode, setIdentifyMode] = useState(() => {
        if (initialPassed && !initialPassed.includes('@')) {
            return 'userid';
        }
        return 'email';
    });
    const [email, setEmail] = useState(() => (initialPassed.includes('@') ? initialPassed : ''));
    const [userId, setUserId] = useState(() => (!initialPassed.includes('@') ? initialPassed : ''));
    const [maskedEmailAddress, setMaskedEmailAddress] = useState('');
    const [accountUsername, setAccountUsername] = useState('');
    const [accountUserCode, setAccountUserCode] = useState(() => (!initialPassed.includes('@') ? initialPassed : ''));

    // Step 2 state
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [codeExpiry, setCodeExpiry] = useState(900); // 15 minutes
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendAttemptCount, setResendAttemptCount] = useState(0);
    const otpRefs = useRef([]);

    // Step 3 state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // ─── Timers ─────────────────────────────────────
    useEffect(() => {
        if (step !== 2) return;
        const timer = setInterval(() => {
            setCodeExpiry((prev) => (prev > 0 ? prev - 1 : 0));
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [step]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // ─── Step 1: Send Verification Code ─────────────
    const handleStep1Submit = async (e) => {
        e.preventDefault();
        setError('');
        const newFieldErrors = {};
        const value = (identifyMode === 'email' ? email : userId).trim();

        if (!value) {
            if (identifyMode === 'email')
                newFieldErrors.email = 'Email address or User ID is required';
            else
                newFieldErrors.userId = 'User ID or Email is required';
        } else if (identifyMode === 'email' && value.includes('@')) {
            const emailErr = ValidationRules.email(value);
            if (emailErr) newFieldErrors.email = emailErr;
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            const firstKey = Object.keys(newFieldErrors)[0];
            const el = document.getElementById(`forgot-${firstKey}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
            return;
        }

        setFieldErrors({});
        setLoading(true);

        try {
            const res = await authApi.forgotPassword(value);
            const data = res.data?.data || res.data || {};

            if (data.email) {
                setEmail(data.email);
            } else if (value.includes('@')) {
                setEmail(value);
            }
            if (data.maskedEmail) {
                setMaskedEmailAddress(data.maskedEmail);
            }
            if (data.username) {
                setAccountUsername(data.username);
            }
            if (data.userCode) {
                setAccountUserCode(data.userCode);
            }
            setOtpDigits(['', '', '', '', '', '']);

            setCodeExpiry(900);
            setResendCooldown(0);
            setStep(2);
        } catch (err) {
            const isAccountNotFound =
                err.response?.status === 404 || err.response?.data?.code === 'ACCOUNT_NOT_FOUND';
            const isAccountBlocked =
                err.response?.status === 403 || err.response?.data?.code === 'ACCOUNT_BLOCKED';
            const isRateLimit = err.response?.status === 429;
            const msg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                (isAccountNotFound
                    ? 'No account found registered with this email address or User ID. Please check your spelling or register a new account.'
                    : isAccountBlocked
                    ? 'Your account has been blocked or suspended by the administrator. Password reset is not permitted.'
                    : isRateLimit
                    ? 'Too many verification requests. Please wait a moment and try again.'
                    : 'Failed to send verification code. Please check your input.');
            setError(msg);
            if (isAccountNotFound) {
                setFieldErrors({
                    [identifyMode === 'email' ? 'email' : 'userId']: msg,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 1: Send via SMS (alt) ─────────────────
    const handleSendSms = async () => {
        setError('');
        const value = identifyMode === 'email' ? email.trim() : userId.trim();
        if (!value) {
            setError('Please enter your identity first');
            return;
        }
        setLoading(true);
        try {
            await authApi.forgotPassword(value);
            setOtpDigits(['', '', '', '', '', '']);
            setCodeExpiry(900);
            setResendCooldown(45);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send SMS code.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2: Verify OTP ─────────────────────────
    const handleOtpChange = (index, val) => {
        if (!/^\d*$/.test(val)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = val.slice(-1);
        setOtpDigits(newDigits);
        // Auto-focus next
        if (val && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newDigits = [...otpDigits];
            pasted.split('').forEach((ch, i) => {
                if (i < 6) newDigits[i] = ch;
            });
            setOtpDigits(newDigits);
            const focusIdx = Math.min(pasted.length, 5);
            otpRefs.current[focusIdx]?.focus();
        }
    };

    const handleStep2Submit = async (e, codeOverride) => {
        if (e && e.preventDefault) e.preventDefault();
        setError('');
        const code = codeOverride || otpDigits.join('');
        if (code.length !== 6) {
            setError('Please enter the complete 6-digit verification code');
            return;
        }
        setLoading(true);
        try {
            const res = await authApi.verifyOtp(email || userId, code);
            const data = res.data?.data || res.data || {};
            if (data.username) setAccountUsername(data.username);
            if (data.userCode) setAccountUserCode(data.userCode);
            if (data.email) setEmail(data.email);
            setStep(3);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Invalid or expired verification code. Please check your inbox and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || loading) return;
        setError('');
        setSuccessMessage('');
        setLoading(true);
        // 2-second debounce prevents accidental double-clicking while allowing quick repeat sends
        setResendCooldown(2);
        try {
            const identifier = email || userId;
            const res = await authApi.forgotPassword(identifier);
            const data = res.data?.data || res.data || {};
            if (data.email) setEmail(data.email);
            if (data.maskedEmail) setMaskedEmailAddress(data.maskedEmail);
            setOtpDigits(['', '', '', '', '', '']);
            setCodeExpiry(900);
            const nextCount = resendAttemptCount + 1;
            setResendAttemptCount(nextCount);
            setSuccessMessage(`A fresh 6-digit verification code has been dispatched to ${data.maskedEmail || maskedEmailAddress || 'your email'}.${nextCount > 1 ? ` (Attempt #${nextCount})` : ''}`);
            setTimeout(() => setSuccessMessage(''), 8000);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 3: Reset Password ─────────────────────
    const pwStrength = checkPasswordStrength(newPassword);

    const handleStep3Submit = async (e) => {
        e.preventDefault();
        setError('');
        const newFieldErrors = {};
        const pwErr = ValidationRules.password(newPassword);
        if (pwErr) newFieldErrors.newPassword = pwErr;
        else if (pwStrength.level === 'weak')
            newFieldErrors.newPassword = 'Password is too weak. Please meet all requirements.';

        const confirmErr = ValidationRules.confirmPassword(confirmPassword, newPassword);
        if (confirmErr) newFieldErrors.confirmPassword = confirmErr;

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            const firstKey = Object.keys(newFieldErrors)[0];
            const el = document.getElementById(`forgot-${firstKey}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
            return;
        }

        setFieldErrors({});
        setLoading(true);
        try {
            const tokenToUse = otpDigits.join('');
            const targetIdentifier = accountUserCode || userId || accountUsername || email;
            await authApi.resetPassword(targetIdentifier, tokenToUse, newPassword);
            setStep(4);
        } catch (err) {
            const isAccountBlocked =
                err.response?.status === 403 || err.response?.data?.code === 'ACCOUNT_BLOCKED';
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                (isAccountBlocked
                    ? 'Your account has been blocked or suspended by the administrator. Password reset is not permitted.'
                    : 'Failed to reset password. Please check your code and try again.')
            );
        } finally {
            setLoading(false);
        }
    };

    // ─── Masking helper for email display ───────────
    const maskedEmail = useCallback(() => {
        const e = email || 'user@example.com';
        const [local, domain] = e.split('@');
        if (!domain) return e;
        const masked = local.slice(0, 2) + '***';
        return `${masked}@${domain}`;
    }, [email]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500 selection:text-white">
            {/* Background Ambient Glow Accents */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px]" />
            </div>

            {/* Top Bar with Brand and Back to Sign In Link */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-sm">
                        <Shield className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <span className="text-sm font-black text-white tracking-tight block">
                            VMS Security Portal
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                            Identity Recovery
                        </span>
                    </div>
                </div>
                <Link
                    to="/login"
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-all shadow-sm"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                </Link>
            </div>

            {/* Main Centered Content Area */}
            <div className="w-full max-w-[460px] mx-auto my-auto py-6 z-10">
                {/* Logo Badge & Title Header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center text-center mb-6"
                >
                    <div className="p-2.5 bg-slate-800/90 backdrop-blur-xl rounded-2xl mb-3 shadow-xl border border-slate-700 inline-flex items-center justify-center ring-4 ring-indigo-500/5">
                        <img
                            src={logoUrl || '/logo.png'}
                            alt={`${orgName} Logo`}
                            className="w-10 h-10 object-contain rounded-xl"
                            onError={(e) => {
                                e.target.src = '/logo.png';
                            }}
                        />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Forgot Password
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">
                        Reset password for <span className="text-slate-200 font-semibold">{orgName || 'IT park'}</span>
                    </p>
                </motion.div>

                {/* Step Indicator */}
                <StepIndicator current={step} />

                {/* Form Card Container */}
                <div className="bg-[#0b101b]/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-indigo-950/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

                    <AnimatePresence mode="wait">
                        {/* ═══════ STEP 1: VERIFY IDENTITY ═══════ */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h3 className="text-base font-extrabold text-white mb-1">
                                    Step 1: Verify Your Identity
                                </h3>
                                <p className="text-xs text-slate-400 mb-5 font-medium">
                                    Enter your registered email address or user ID to receive a verification code.
                                </p>

                                {/* Toggle: By Email / By User ID */}
                                <div className="flex mb-5 bg-[#070b13] rounded-xl p-1 border border-slate-800/80">
                                    {['email', 'userid'].map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => {
                                                setIdentifyMode(mode);
                                                setError('');
                                            }}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                                identifyMode === mode
                                                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400/30'
                                                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                                            }`}
                                        >
                                            {mode === 'email' ? (
                                                <>
                                                    <Mail className="h-3.5 w-3.5 shrink-0" /> By Email
                                                </>
                                            ) : (
                                                <>
                                                    <UserIcon className="h-3.5 w-3.5 shrink-0" /> By User ID
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleStep1Submit} className="space-y-4" autoComplete="off">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-semibold flex items-start gap-2.5"
                                        >
                                            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    {identifyMode === 'email' ? (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-300 mb-2">
                                                Email Address <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="forgot-email"
                                                    type="email"
                                                    data-invalid={Boolean(fieldErrors.email)}
                                                    aria-invalid={Boolean(fieldErrors.email)}
                                                    className={`w-full bg-[#05080e] border rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                        fieldErrors.email
                                                            ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                            : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                    }`}
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        clearFieldError('email');
                                                    }}
                                                    placeholder="e.g. name@company.com"
                                                />
                                            </div>
                                            <FieldError error={fieldErrors.email} id="forgot-email-error" />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-300 mb-2">
                                                User ID <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="forgot-userId"
                                                    type="text"
                                                    data-invalid={Boolean(fieldErrors.userId)}
                                                    aria-invalid={Boolean(fieldErrors.userId)}
                                                    className={`w-full bg-[#05080e] border rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                        fieldErrors.userId
                                                            ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                            : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                    }`}
                                                    value={userId}
                                                    onChange={(e) => {
                                                        setUserId(e.target.value);
                                                        clearFieldError('userId');
                                                    }}
                                                    placeholder="e.g. ADM000001 or VIS-001"
                                                />
                                            </div>
                                            <FieldError error={fieldErrors.userId} id="forgot-userId-error" />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/25 active:scale-[0.99]"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Sending Verification Code...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="h-4 w-4" />
                                                Send Verification Code
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-center gap-3 my-2">
                                        <div className="flex-1 h-px bg-slate-800" />
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                            or
                                        </span>
                                        <div className="flex-1 h-px bg-slate-800" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSendSms}
                                        disabled={loading}
                                        className="w-full border border-slate-700/80 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-indigo-500/40 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Smartphone className="h-4 w-4 text-slate-400" />
                                        Send Code via SMS
                                    </button>

                                    <div className="pt-2 text-center">
                                        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                                            <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                            <span>
                                                A 6-digit verification code will be dispatched to your registered address.
                                            </span>
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* ═══════ STEP 2: VERIFY CODE ═══════ */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <h3 className="text-base font-extrabold text-white mb-1">
                                    Step 2: Verify Security Code
                                </h3>
                                <p className="text-xs text-slate-400 mb-4 font-medium">
                                    We sent a 6-digit verification code to
                                </p>

                                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 text-center mb-5">
                                    <span className="text-xs font-bold text-indigo-300 tracking-wide font-mono">
                                        {maskedEmailAddress || maskedEmail()}
                                    </span>
                                </div>

                                <form onSubmit={handleStep2Submit} className="space-y-5">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-semibold flex items-start gap-2.5"
                                        >
                                            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-300 mb-3 text-center">
                                            Enter 6-Digit Verification Code <span className="text-red-400">*</span>
                                        </label>
                                        <div
                                            className="flex gap-2 sm:gap-2.5 justify-center"
                                            onPaste={handleOtpPaste}
                                        >
                                            {otpDigits.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    ref={(el) => {
                                                        otpRefs.current[idx] = el;
                                                    }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black bg-[#05080e] border rounded-xl text-white focus:outline-none transition-all ${
                                                        digit
                                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/15'
                                                            : 'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
                                            Code expires in{' '}
                                            <span className="text-amber-400 font-bold font-mono">
                                                {formatTime(codeExpiry)}
                                            </span>
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || otpDigits.join('').length !== 6}
                                        className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/25 active:scale-[0.99]"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Verifying Code...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                Verify Code
                                            </>
                                        )}
                                    </button>

                                    {/* Success notification if code resent */}
                                    {successMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>{successMessage}</span>
                                        </motion.div>
                                    )}

                                    {/* Medium-sized, visible, hoverable Resend & Change Identity Action Section */}
                                    <div className="pt-4 border-t border-slate-800/80 space-y-3">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-xs text-slate-300 font-medium">
                                                Didn't receive the code? Check your spam folder
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleResendCode}
                                                disabled={resendCooldown > 0 || loading}
                                                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 border cursor-pointer ${
                                                    resendCooldown > 0 || loading
                                                        ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 cursor-wait shadow-inner opacity-80'
                                                        : 'bg-indigo-950/60 hover:bg-indigo-600 border-indigo-500/60 hover:border-indigo-400 text-indigo-200 hover:text-white shadow-md hover:shadow-indigo-500/25 active:scale-[0.99]'
                                                }`}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${loading || resendCooldown > 0 ? 'animate-spin' : ''}`} />
                                                <span>
                                                    {loading
                                                        ? 'Sending New Code...'
                                                        : resendAttemptCount > 0
                                                        ? 'Resend New Verification Code'
                                                        : 'Resend Verification Code'}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="text-center pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep(1);
                                                    setError('');
                                                    setSuccessMessage('');
                                                }}
                                                className="w-full py-2 px-3 rounded-xl text-sm font-bold text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-sm"
                                            >
                                                <ArrowLeft className="h-4 w-4 text-slate-300 group-hover:text-white transition-colors" />
                                                <span>Wrong email or user ID? Change Identity</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* ═══════ STEP 3: NEW PASSWORD ═══════ */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <h3 className="text-base font-extrabold text-white mb-1">
                                    Step 3: Create New Password
                                </h3>
                                <p className="text-xs text-slate-400 mb-4 font-medium">
                                    Choose a strong, unique password for your account.
                                </p>

                                <form onSubmit={handleStep3Submit} className="space-y-4" autoComplete="off">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-semibold flex items-start gap-2.5"
                                        >
                                            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    {/* Account Identity Chip */}
                                    <div className="bg-[#070b13] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                                                Resetting Password For
                                            </span>
                                            <span className="text-xs font-bold text-white truncate block">
                                                {accountUserCode || userId || accountUsername || email}
                                                {email && (accountUserCode || accountUsername) ? ` • ${email}` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-300 mb-2">
                                            New Password <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="forgot-newPassword"
                                                name="newPassword"
                                                type={showNewPw ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                data-invalid={Boolean(fieldErrors.newPassword)}
                                                aria-invalid={Boolean(fieldErrors.newPassword)}
                                                className={`w-full bg-[#05080e] border rounded-xl pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                    fieldErrors.newPassword
                                                        ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                        : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                }`}
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value);
                                                    clearFieldError('newPassword');
                                                }}
                                                placeholder="••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPw(!showNewPw)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                                            >
                                                {showNewPw ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Strength bar */}
                                        {newPassword && (
                                            <div className="mt-2.5">
                                                <div className="flex gap-1.5 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                                            pwStrength.passed >= 1
                                                                ? pwStrength.level === 'weak'
                                                                    ? 'bg-rose-500'
                                                                    : pwStrength.level === 'medium'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                                : 'bg-slate-800'
                                                        }`}
                                                    />
                                                    <div
                                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                                            pwStrength.passed >= 3
                                                                ? pwStrength.level === 'medium'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                                : 'bg-slate-800'
                                                        }`}
                                                    />
                                                    <div
                                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                                            pwStrength.passed >= 4 ? 'bg-emerald-500' : 'bg-slate-800'
                                                        }`}
                                                    />
                                                </div>
                                                <p
                                                    className={`text-[10px] mt-1.5 font-bold ${
                                                        pwStrength.level === 'weak'
                                                            ? 'text-rose-400'
                                                            : pwStrength.level === 'medium'
                                                            ? 'text-amber-400'
                                                            : 'text-emerald-400'
                                                    }`}
                                                >
                                                    {pwStrength.level === 'weak'
                                                        ? 'Weak Password'
                                                        : pwStrength.level === 'medium'
                                                        ? 'Medium Password'
                                                        : 'Strong Password'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-300 mb-2">
                                            Confirm New Password <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="forgot-confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPw ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                data-invalid={Boolean(fieldErrors.confirmPassword)}
                                                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                                                className={`w-full bg-[#05080e] border rounded-xl pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                    fieldErrors.confirmPassword
                                                        ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                        : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                }`}
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    clearFieldError('confirmPassword');
                                                }}
                                                placeholder="••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                                            >
                                                {showConfirmPw ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <FieldError error={fieldErrors.confirmPassword} id="forgot-confirmPassword-error" />
                                    </div>

                                    {/* Requirements Checklist */}
                                    <div className="space-y-1.5 pt-1 bg-[#070b13]/60 p-3 rounded-xl border border-slate-800/80">
                                        {[
                                            { met: pwStrength.checks.length, label: 'At least 8 characters long' },
                                            { met: pwStrength.checks.cases, label: 'Contains uppercase and lowercase letters' },
                                            { met: pwStrength.checks.number, label: 'Contains at least one number' },
                                            { met: pwStrength.checks.special, label: 'Contains at least one special symbol' },
                                        ].map(({ met, label }) => (
                                            <div key={label} className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                                        met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                                    }`}
                                                >
                                                    {met ? (
                                                        <CheckCircle className="h-3 w-3" />
                                                    ) : (
                                                        <span className="text-[9px] font-bold">○</span>
                                                    )}
                                                </div>
                                                <span className={`text-[11px] font-medium ${met ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || newPassword !== confirmPassword || pwStrength.level === 'weak'}
                                        className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/25 active:scale-[0.99]"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Updating Password...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                Reset Password
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* ═══════ STEP 4: COMPLETE ═══════ */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35 }}
                                className="text-center py-6"
                            >
                                <div className="flex justify-center mb-5">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.4, delay: 0.15, type: 'spring', stiffness: 200 }}
                                        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10"
                                    >
                                        <CheckCircle className="h-10 w-10 text-emerald-400" />
                                    </motion.div>
                                </div>

                                <h3 className="text-2xl font-black text-white mb-2">
                                    Password Reset Successful!
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-8 font-medium">
                                    Your password has been securely updated. You can now sign in with your new credentials.
                                </p>

                                <Link
                                    to="/login"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/25"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Sign In to Your Account
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Support Help Footer */}
                {(orgPhone || orgEmail) && (
                    <div className="mt-6 text-center text-xs text-slate-400 font-medium">
                        <span>Need help resetting your account? Contact </span>
                        {orgPhone && (
                            <a href={`tel:${orgPhone}`} className="text-indigo-400 hover:underline mx-1 font-bold">
                                {orgPhone}
                            </a>
                        )}
                        {orgPhone && orgEmail && <span>•</span>}
                        {orgEmail && (
                            <a href={`mailto:${orgEmail}`} className="text-indigo-400 hover:underline mx-1 font-bold">
                                {orgEmail}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
