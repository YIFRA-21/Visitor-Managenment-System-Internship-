import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, CheckCircle, Mail, Eye, EyeOff, Lock, User as UserIcon, KeyRound, MessageSquare, } from 'lucide-react';
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
    if (passed >= 4)
        level = 'strong';
    else if (passed >= 3)
        level = 'medium';
    return { checks, level, passed };
}
// ─── Step indicator component ───────────────────────────
function StepIndicator({ current }) {
    const steps = [
        { num: 1, label: 'Verify Identity', icon: UserIcon },
        { num: 2, label: 'Verify Code', icon: KeyRound },
        { num: 3, label: 'New Password', icon: Lock },
        { num: 4, label: 'Complete', icon: CheckCircle },
    ];
    return (<div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = current > step.num;
            const isActive = current === step.num;
            const isUpcoming = current < step.num;
            return (<div key={step.num} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${isCompleted
                    ? 'bg-emerald-500 border-emerald-500'
                    : isActive
                        ? 'border-[#7F77DD] bg-[#7F77DD]/15'
                        : 'border-slate-700 bg-[#0b101b]'}`}>
                {isCompleted ? (<CheckCircle className="h-5 w-5 text-white"/>) : (<StepIcon className={`h-4 w-4 ${isActive ? 'text-[#7F77DD]' : 'text-slate-500'}`}/>)}
              </div>
              <span className={`text-[9px] mt-1.5 font-semibold uppercase tracking-wider ${isCompleted
                    ? 'text-emerald-400'
                    : isActive
                        ? 'text-[#7F77DD]'
                        : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (<div className="flex-1 mx-2 mt-[-16px]">
                <div className={`h-[2px] rounded transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`}/>
              </div>)}
          </div>);
        })}
    </div>);
}
// ─── Main Forgot Password Page ──────────────────────────
export default function ForgotPasswordPage() {
    const location = useLocation();
    const initialPassed = location.state?.identifier || '';
    const { organization, logoUrl, orgName, orgEmail, orgPhone } = useOrganization();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const clearFieldError = (field) => setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
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
    const [resendCooldown, setResendCooldown] = useState(45);
    const otpRefs = useRef([]);

    // Step 3 state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    // ─── Timers ─────────────────────────────────────
    useEffect(() => {
        if (step !== 2)
            return;
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
        }
        else if (identifyMode === 'email' && value.includes('@')) {
            const emailErr = ValidationRules.email(value);
            if (emailErr)
                newFieldErrors.email = emailErr;
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
            // Store user account email and masked email returned from backend
            if (res.data?.email) {
                setEmail(res.data.email);
            }
            else if (value.includes('@')) {
                setEmail(value);
            }
            if (res.data?.maskedEmail) {
                setMaskedEmailAddress(res.data.maskedEmail);
            }
            if (res.data?.username) {
                setAccountUsername(res.data.username);
            }
            if (res.data?.userCode) {
                setAccountUserCode(res.data.userCode);
            }
            setOtpDigits(['', '', '', '', '', '']);
            setCodeExpiry(900);
            setResendCooldown(45);
            setStep(2);
        }
        catch (err) {
            const isAccountNotFound = err.response?.status === 404 || err.response?.data?.code === 'ACCOUNT_NOT_FOUND';
            const isAccountBlocked = err.response?.status === 403 || err.response?.data?.code === 'ACCOUNT_BLOCKED';
            const msg = err.response?.data?.error ||
                err.response?.data?.message ||
                (isAccountNotFound ? 'No account found registered with this email address. Please check your spelling or register a new account.' :
                 isAccountBlocked ? 'Your account has been blocked or suspended by the administrator. Password reset is not permitted.' :
                 'Failed to send verification code. Please check your input.');
            setError(msg);
            if (isAccountNotFound) {
                setFieldErrors({
                    [identifyMode === 'email' ? 'email' : 'userId']: msg
                });
            }
        }
        finally {
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
            const res = await authApi.forgotPassword(value);
            if (res.data.demoToken) {
                setDemoToken(res.data.demoToken);
                const digits = String(res.data.demoToken).padStart(6, '0').slice(0, 6).split('');
                setOtpDigits(digits);
            }
            setCodeExpiry(900);
            setResendCooldown(45);
            setStep(2);
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to send SMS code.');
        }
        finally {
            setLoading(false);
        }
    };
    // ─── Step 2: Verify OTP ─────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value))
            return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        // Auto-focus next
        if (value && index < 5) {
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
            pasted.split('').forEach((ch, i) => { if (i < 6)
                newDigits[i] = ch; });
            setOtpDigits(newDigits);
            const focusIdx = Math.min(pasted.length, 5);
            otpRefs.current[focusIdx]?.focus();
        }
    };
    const handleStep2Submit = async (e) => {
        e.preventDefault();
        setError('');
        const code = otpDigits.join('');
        if (code.length !== 6) {
            setError('Please enter the complete 6-digit verification code');
            return;
        }
        setLoading(true);
        try {
            const res = await authApi.verifyOtp(email || userId, code);
            if (res.data?.username)
                setAccountUsername(res.data.username);
            if (res.data?.userCode)
                setAccountUserCode(res.data.userCode);
            if (res.data?.email)
                setEmail(res.data.email);
            setStep(3);
        }
        catch (err) {
            // For demo mode, skip OTP verification if we have a demoToken
            if (demoToken) {
                setStep(3);
            }
            else {
                setError(err.response?.data?.error ||
                    err.response?.data?.message ||
                    'Invalid verification code. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendCode = async () => {
        if (resendCooldown > 0)
            return;
        setError('');
        setLoading(true);
        try {
            const identifier = email || userId;
            const res = await authApi.resendVerification(identifier);
            if (res.data?.email) {
                setEmail(res.data.email);
            }
            if (res.data?.maskedEmail) {
                setMaskedEmailAddress(res.data.maskedEmail);
            }
            setOtpDigits(['', '', '', '', '', '']);
            setResendCooldown(45);
        }
        catch (err) {
            setError('Failed to resend code. Please try again.');
        }
        finally {
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
        if (pwErr)
            newFieldErrors.newPassword = pwErr;
        else if (pwStrength.level === 'weak')
            newFieldErrors.newPassword = 'Password is too weak. Please meet all requirements.';
        const confirmErr = ValidationRules.confirmPassword(confirmPassword, newPassword);
        if (confirmErr)
            newFieldErrors.confirmPassword = confirmErr;
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
            const tokenToUse = otpDigits.join('') || demoToken;
            const targetIdentifier = accountUserCode || userId || accountUsername || email;
            await authApi.resetPassword(targetIdentifier, tokenToUse, newPassword);
            setStep(4);
        }
        catch (err) {
            const isAccountBlocked = err.response?.status === 403 || err.response?.data?.code === 'ACCOUNT_BLOCKED';
            setError(err.response?.data?.error ||
                err.response?.data?.message ||
                (isAccountBlocked ? 'Your account has been blocked or suspended by the administrator. Password reset is not permitted.' :
                 'Failed to reset password. Please try again.'));
        }
        finally {
            setLoading(false);
        }
    };
    // ─── Masking helper for email display ───────────
    const maskedEmail = useCallback(() => {
        const e = email || 'user@example.com';
        const [local, domain] = e.split('@');
        if (!domain)
            return e;
        const masked = local.slice(0, 2) + '***';
        return `${masked}@${domain}`;
    }, [email]);
    // ═══════════════════════════════════════════════════
    //   RENDER
    // ═══════════════════════════════════════════════════
    return (<div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Top Bar with Back to Sign In Link */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-50 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-slate-700">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-[#7F77DD]"/>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">VMS Security</span>
        </div>
        <Link to="/login" className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-[#7F77DD] hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5"/>
          Back to Sign In
        </Link>
      </div>

      {/* Main Centered Content Area — Decreased Compact Card Container */}
      <div className="w-full max-w-[430px] mx-auto my-auto py-4">
        {/* Logo Badge & Title Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center mb-6">
          {/* Logo image top above Forgot Password text */}
          <div className="p-2.5 bg-white dark:bg-slate-800/90 backdrop-blur-md rounded-2xl mb-3 shadow-lg border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center">
            <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="w-10 h-10 object-contain rounded-xl" onError={(e) => {
            e.target.src = '/logo.png';
        }}/>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Reset password for {orgName}
          </p>
        </motion.div>

        {/* Step Indicator */}
        <StepIndicator current={step}/>

        {/* Form Card Container — Decreased Compact Sizing */}
        <div className="bg-white dark:bg-[#0b101b] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl shadow-slate-200/60 dark:shadow-[0_0_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"/>

          <AnimatePresence mode="wait">
            {/* ═══════ STEP 1: VERIFY IDENTITY ═══════ */}
            {step === 1 && (<motion.div key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                  Step 1: Verify Your Identity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-medium">
                  Enter your registered email address or user ID to receive a verification code.
                </p>

                {/* Toggle: By Email / By User ID */}
                <div className="flex mb-5 bg-slate-100 dark:bg-[#070b13] rounded-xl p-1 border border-slate-200 dark:border-slate-800/80">
                  {['email', 'userid'].map((mode) => (<button key={mode} type="button" onClick={() => { setIdentifyMode(mode); setError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${identifyMode === mode
                    ? 'bg-white dark:bg-[#7F77DD] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-purple-400/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'}`}>
                      {mode === 'email' ? (<>
                          <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-inherit"/> By Email
                        </>) : (<>
                          <UserIcon className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-inherit"/> By User ID
                        </>)}
                    </button>))}
                </div>

                    <form onSubmit={handleStep1Submit} className="space-y-4" autoComplete="off">
                      {error && (<div className="rounded-lg border border-red-500/20 bg-red-950/25 p-3 text-xs text-red-400 font-semibold">
                          {error}
                        </div>)}

                      {identifyMode === 'email' ? (<div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-2">
                            Email Address <span className="text-red-400">*</span>
                          </label>
                          <input id="forgot-email" type="email" data-invalid={Boolean(fieldErrors.email)} aria-invalid={Boolean(fieldErrors.email)} className={`w-full bg-[#05080e] border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${fieldErrors.email
                    ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-[#7F77DD] focus:ring-[#7F77DD]/20'}`} value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }} placeholder="Enter your registered email address"/>
                          <FieldError error={fieldErrors.email} id="forgot-email-error"/>
                        </div>) : (<div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-2">
                            User ID <span className="text-red-400">*</span>
                          </label>
                          <input id="forgot-userId" type="text" data-invalid={Boolean(fieldErrors.userId)} aria-invalid={Boolean(fieldErrors.userId)} className={`w-full bg-[#05080e] border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${fieldErrors.userId
                    ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-[#7F77DD] focus:ring-[#7F77DD]/20'}`} value={userId} onChange={(e) => { setUserId(e.target.value); clearFieldError('userId'); }} placeholder="Enter your user ID"/>
                          <FieldError error={fieldErrors.userId} id="forgot-userId-error"/>
                        </div>)}

                      <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-[0_0_15px_rgba(127,119,221,0.15)]">
                        {loading ? (<span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                            <Mail className="h-4 w-4"/>
                            Send Verification Code
                          </>)}
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-800"/>
                        <span className="text-[10px] text-slate-500">or</span>
                        <div className="flex-1 h-px bg-slate-800"/>
                      </div>

                      <button type="button" onClick={handleSendSms} disabled={loading} className="w-full border border-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/5 disabled:opacity-50">
                        <MessageSquare className="h-4 w-4"/>
                        Send Code via SMS
                      </button>

                      <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                        <span className="text-amber-400">●</span>
                        Didn't receive the code? Check your spam folder or try again in{' '}
                        <span className="text-white font-bold">60</span> seconds.
                      </p>
                    </form>
                  </motion.div>)}

                {/* ═══════ STEP 2: VERIFY CODE ═══════ */}
                {step === 2 && (<motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <h3 className="text-base font-bold text-white mb-1">
                      Step 2: Verify Code
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-1">
                      We have sent a 6-digit verification code to
                    </p>
                    <p className="text-xs font-bold mb-5" style={{ color: 'var(--accent-purple)' }}>
                      {maskedEmailAddress || maskedEmail()}
                    </p>

                    <form onSubmit={handleStep2Submit} className="space-y-5">
                      {error && (<div className="rounded-lg border border-red-500/20 bg-red-950/25 p-3 text-xs text-red-400 font-semibold">
                          {error}
                        </div>)}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-3">
                          Enter Verification Code <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={handleOtpPaste}>
                          {otpDigits.map((digit, idx) => (<input key={idx} ref={(el) => { otpRefs.current[idx] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(idx, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(idx, e)} className={`w-10 h-12 sm:w-12 sm:h-14 max-w-[48px] text-center text-base sm:text-lg font-bold bg-[#05080e] border rounded-lg text-white focus:outline-none transition-all ${digit
                    ? 'border-[#7F77DD] ring-1 ring-[#7F77DD]/20'
                    : 'border-slate-700 focus:border-[#7F77DD]'}`}/>))}
                        </div>
                        <p className="text-[10px] text-slate-500 text-center mt-2">
                          Code expires in{' '}
                          <span className="text-amber-400 font-bold">{formatTime(codeExpiry)}</span>{' '}
                          minutes
                        </p>
                      </div>

                      <button type="submit" disabled={loading || otpDigits.join('').length !== 6} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-[0_0_15px_rgba(127,119,221,0.15)]">
                        {loading ? (<span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                            <CheckCircle className="h-4 w-4"/>
                            Verify Code
                          </>)}
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-800"/>
                        <span className="text-[10px] text-slate-500">or</span>
                        <div className="flex-1 h-px bg-slate-800"/>
                      </div>

                      <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0 || loading} className="w-full border border-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/5 disabled:opacity-50">
                        <Mail className="h-4 w-4"/>
                        {resendCooldown > 0
                ? `Resend Code (${formatTime(resendCooldown)})`
                : 'Resend Code'}
                      </button>
                    </form>
                  </motion.div>)}

                {/* ═══════ STEP 3: NEW PASSWORD ═══════ */}
                {step === 3 && (<motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <h3 className="text-base font-bold text-white mb-1">
                      Step 3: Create New Password
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-5">
                      Enter your new password below.
                    </p>

                    <form onSubmit={handleStep3Submit} className="space-y-4" autoComplete="off">
                      {error && (<div className="rounded-lg border border-red-500/20 bg-red-950/25 p-3 text-xs text-red-400 font-semibold">
                          {error}
                        </div>)}

                      {/* Explicit Account Badge for User Confidence & Verification */}
                      <div className="bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-3 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-purple-900/30 rounded-lg text-indigo-600 dark:text-[#7F77DD] shrink-0">
                          <UserIcon className="h-4 w-4"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                            Resetting Password For
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                            {accountUserCode || userId || accountUsername || email}
                            {email && (accountUserCode || accountUsername) ? ` • ${email}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Hidden Username input */}
                      <input type="text" name="username" id="forgot-username-field" autoComplete="off" value={accountUserCode || userId || accountUsername || email} readOnly tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -1 }}/>

                      {/* New Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-2">
                          New Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input id="forgot-newPassword" name="newPassword" type={showNewPw ? 'text' : 'password'} autoComplete="new-password" data-invalid={Boolean(fieldErrors.newPassword)} aria-invalid={Boolean(fieldErrors.newPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${fieldErrors.newPassword
                ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-[#7F77DD]/20'}`} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); clearFieldError('newPassword'); }} placeholder="••••••••••••"/>
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showNewPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                          </button>
                        </div>
                        {/* Strength bar */}
                        {newPassword && (<div className="mt-2">
                            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                              <div className={`flex-1 rounded-full transition-all ${pwStrength.passed >= 1
                    ? pwStrength.level === 'weak'
                        ? 'bg-red-500'
                        : pwStrength.level === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                    : 'bg-slate-800'}`}/>
                              <div className={`flex-1 rounded-full transition-all ${pwStrength.passed >= 3
                    ? pwStrength.level === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    : 'bg-slate-800'}`}/>
                              <div className={`flex-1 rounded-full transition-all ${pwStrength.passed >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`}/>
                            </div>
                            <p className={`text-[10px] mt-1 font-bold ${pwStrength.level === 'weak'
                    ? 'text-red-400'
                    : pwStrength.level === 'medium'
                        ? 'text-amber-400'
                        : 'text-emerald-400'}`}>
                              {pwStrength.level === 'weak'
                    ? 'Weak Password'
                    : pwStrength.level === 'medium'
                        ? 'Medium Password'
                        : 'Strong Password'}
                            </p>
                          </div>)}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-2">
                          Confirm New Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input id="forgot-confirmPassword" name="confirmPassword" type={showConfirmPw ? 'text' : 'password'} autoComplete="new-password" data-invalid={Boolean(fieldErrors.confirmPassword)} aria-invalid={Boolean(fieldErrors.confirmPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${fieldErrors.confirmPassword
                ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-[#7F77DD]/20'}`} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }} placeholder="••••••••••••"/>
                          <FieldError error={fieldErrors.confirmPassword} id="forgot-confirmPassword-error"/>
                          <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showConfirmPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                          </button>
                        </div>
                      </div>

                      {/* Requirements Checklist */}
                      <div className="space-y-1.5 pt-1">
                        {[
                { met: pwStrength.checks.length, label: 'At least 8 characters long' },
                { met: pwStrength.checks.cases, label: 'Contains uppercase and lowercase letters' },
                { met: pwStrength.checks.number, label: 'Contains at least one number' },
                { met: pwStrength.checks.special, label: 'Contains at least one special character' },
            ].map(({ met, label }) => (<div key={label} className="flex items-center gap-2">
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${met ? 'bg-emerald-500/20' : 'bg-red-500/10'}`}>
                              {met ? (<CheckCircle className="h-3 w-3 text-emerald-400"/>) : (<span className="text-[8px] text-red-400 font-bold">✗</span>)}
                            </div>
                            <span className={`text-[11px] ${met ? 'text-emerald-400' : 'text-red-400'}`}>
                              {label}
                            </span>
                          </div>))}
                      </div>

                      <button type="submit" disabled={loading || newPassword !== confirmPassword || pwStrength.level === 'weak'} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-[0_0_15px_rgba(127,119,221,0.15)]">
                        {loading ? (<span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                            <Lock className="h-4 w-4"/>
                            Reset Password
                          </>)}
                      </button>
                    </form>
                  </motion.div>)}

                {/* ═══════ STEP 4: COMPLETE ═══════ */}
                {step === 4 && (<motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="text-center py-6">
                    {/* Large success checkmark */}
                    <div className="flex justify-center mb-5">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: 0.15, type: 'spring', stiffness: 200 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500/30">
                        <CheckCircle className="h-10 w-10 text-emerald-500"/>
                      </motion.div>
                    </div>

                    <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--accent-purple)' }}>
                      Password Reset Successful!
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-8">
                      Your password has been reset successfully.
                      <br />
                      You can now sign in with your new password.
                    </p>

                    <Link to="/login" style={{ backgroundColor: 'var(--accent-purple)' }} className="inline-flex items-center gap-2 text-white font-semibold py-3 px-8 rounded-lg transition-all hover:opacity-90 shadow-[0_0_15px_rgba(127,119,221,0.15)]">
                      <ArrowLeft className="h-4 w-4"/>
                      Back to Sign In
                    </Link>
                  </motion.div>)}
              </AnimatePresence>
            </div>
          </div>

        {/* Support Help Footer */}
        {(orgPhone || orgEmail) && (<div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>Need help resetting your account? Contact </span>
            {orgPhone && (<a href={`tel:${orgPhone}`} className="text-purple-400 hover:underline mx-1 font-semibold">
                {orgPhone}
              </a>)}
            {orgPhone && orgEmail && <span>•</span>}
            {orgEmail && (<a href={`mailto:${orgEmail}`} className="text-purple-400 hover:underline mx-1 font-semibold">
                {orgEmail}
              </a>)}
          </div>)}
    </div>);
}
