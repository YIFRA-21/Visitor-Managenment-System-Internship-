import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Shield, Check, Lock, Mail, RefreshCw, Eye, EyeOff, User, ShieldCheck, Loader2, Copy, Key } from 'lucide-react';
import { authApi, getErrorMessage } from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { useOrganization } from '../../../../contexts/OrganizationContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import LanguageDropdown from '../../../../components/common/LanguageDropdown';
import ThemeToggle from '../../../../components/ThemeToggle/ThemeToggle';
import CountryNationalitySelect from '../../../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../../../components/common/CountryPhoneInput';
import { validateDateOfBirth, validatePhoneNumber } from '../../../../data/countriesData';
import {
    validateName,
    validateMiddleName,
    validateEmail,
    validatePhone,
    validateText,
    validatePassword as validatePasswordPolicy,
    validatePasswordConfirmation
} from '../../../../utils/formValidation';

export default function SignupPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { organization, logoUrl, orgName, orgEmail, orgPhone, orgWebsite } = useOrganization();
    const { language, setLanguage, t } = useLanguage();
    const STEPS = [
        { title: t('signup.personalInfo'), desc: t('signup.personalInfoDesc') },
        { title: t('signup.accountCredentials'), desc: t('signup.accountCredentialsDesc') },
        { title: t('signup.emailOTP'), desc: t('signup.emailOTPDesc') }
    ];
    // Current Step state (0: Personal Info, 1: Account Credentials, 2: Email OTP, 3: Success Welcome Screen)
    const [currentStep, setCurrentStep] = useState(0);
    // Auto-generated Reference Number
    const [referenceCode] = useState(() => {
        const existing = sessionStorage.getItem('signup_refCode');
        if (existing)
            return existing;
        const generated = `VMS${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        sessionStorage.setItem('signup_refCode', generated);
        return generated;
    });

    useEffect(() => {
        try {
            sessionStorage.removeItem('signup_debug_otp');
        } catch (_) {}
    }, []);

    // Step 1: Personal Information (Starts Fresh and Empty for Each Visitor)
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [nationality, setNationality] = useState('Ethiopian');
    const [phone, setPhone] = useState('');
    const [phonePrefix, setPhonePrefix] = useState('+251');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [showBirthdayInfo, setShowBirthdayInfo] = useState(false);

    // Helper to detect if a phone number or prefix belongs to Ethiopia
    const isEthiopianPhone = (phoneNum, prefix) => {
        const raw = String(phoneNum || '').trim();
        const digits = raw.replace(/\D/g, '');
        const cleanPrefix = String(prefix || '').trim();

        if (cleanPrefix === '+251' || cleanPrefix === '251') return true;
        if (raw.startsWith('+251')) return true;
        if (digits.startsWith('251')) return true;
        if (digits.startsWith('09') || digits.startsWith('07')) return true;
        if ((cleanPrefix === '+251' || !cleanPrefix) && (digits.startsWith('9') || digits.startsWith('7'))) return true;
        return false;
    };

    const handlePhoneChange = (e) => {
        const val = typeof e === 'string' ? e : e?.target?.value || '';
        setPhone(val);
        clearFieldError('phone');

        // When Ethiopian phone number entered or +251, automatically select Ethiopian nationality
        if (isEthiopianPhone(val, phonePrefix)) {
            setNationality('Ethiopian');
            clearFieldError('nationality');
        }
    };

    const handleDialCodeChange = (dial, countryObj) => {
        setPhonePrefix(dial);
        clearFieldError('phone');

        if (dial === '+251' || (countryObj && countryObj.code === 'ET')) {
            setNationality('Ethiopian');
            clearFieldError('nationality');
        } else {
            const digits = phone.replace(/\D/g, '');
            const hasEtNumber = digits.startsWith('09') || digits.startsWith('07') || digits.startsWith('251') || (digits.length >= 9 && (digits.startsWith('9') || digits.startsWith('7')));
            if (hasEtNumber) {
                setPhonePrefix('+251');
                setNationality('Ethiopian');
                setFieldErrors(prev => ({
                    ...prev,
                    phone: 'This phone number format is Ethiopian (+251). Dial code remains +251 and nationality is Ethiopia.'
                }));
            } else if (countryObj && countryObj.nationality) {
                setNationality(countryObj.nationality);
                clearFieldError('nationality');
            }
        }
    };

    const handleNationalityChange = (e, countryObj) => {
        const selectedVal = typeof e === 'string' ? e : (e?.target?.value || '');
        const selectedCountry = countryObj || e?.target?.country;

        const isEt = isEthiopianPhone(phone, phonePrefix);

        // If phone number is Ethiopian, enforce Ethiopian nationality and prevent others
        if (isEt) {
            if (selectedVal && selectedVal.toLowerCase() !== 'ethiopian' && selectedVal.toLowerCase() !== 'ethiopia') {
                setNationality('Ethiopian');
                setFieldErrors(prev => ({
                    ...prev,
                    nationality: 'Ethiopian phone numbers (+251) require Ethiopia as nationality.'
                }));
                return;
            }
        }

        setNationality(selectedVal);
        clearFieldError('nationality');

        // Auto-sync dial code if country changed and phone is not Ethiopian
        if (selectedCountry && selectedCountry.dialCode && !isEt) {
            setPhonePrefix(selectedCountry.dialCode);
        }
    };

    // Derived formatted Date of Birth: YYYY-MM-DD
    const dateOfBirth = (birthYear && birthMonth && birthDay)
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : '';
    // Live validation for age >= 18 and calendar accuracy
    const dobValidation = React.useMemo(() => {
        if (!birthYear && !birthMonth && !birthDay) return null;
        if (!birthYear || !birthMonth || !birthDay) return { partial: true };
        return validateDateOfBirth(dateOfBirth, 18);
    }, [dateOfBirth, birthYear, birthMonth, birthDay]);
    // Step 2: Account Credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [copiedUserId, setCopiedUserId] = useState(false);
    // Step 3: OTP Verification
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(120);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [resendingEmail, setResendingEmail] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [otpStatus, setOtpStatus] = useState('idle');
    const [devOtpCode, setDevOtpCode] = useState('');
    // General Status & Validation Errors
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const clearFieldError = (field) => setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    const handleResetForm = () => {
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setGender('');
        setBirthMonth('');
        setBirthDay('');
        setBirthYear('');
        setNationality('Ethiopian');
        setPhone('');
        setPhonePrefix('+251');
        setEmail('');
        setAddress('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setFieldErrors({});
        setError('');
        const sessionKeys = [
            'signup_firstName', 'signup_middleName', 'signup_lastName',
            'signup_gender', 'signup_dateOfBirth', 'signup_nationality',
            'signup_phone', 'signup_phonePrefix', 'signup_email', 'signup_address', 'signup_username', 'signup_refCode'
        ];
        sessionKeys.forEach(k => sessionStorage.removeItem(k));
    };
    // Clean stale persisted visitor data on mount so new visitor registration always starts 100% fresh
    useEffect(() => {
        handleResetForm();
    }, []);
    // Auto-generate suggested User ID from email if empty
    useEffect(() => {
        if (email && !username) {
            const suggested = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            setUsername(suggested || `visitor_${Math.floor(1000 + Math.random() * 9000)}`);
        }
    }, [email]);
    // OTP Countdown timer
    useEffect(() => {
        let timer;
        if (currentStep === 2 && otpTimer > 0) {
            timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [currentStep, otpTimer]);
    // Copy User ID helper
    const handleCopyUserId = (textToCopy) => {
        if (!textToCopy)
            return;
        navigator.clipboard.writeText(textToCopy);
        setCopiedUserId(true);
        setTimeout(() => setCopiedUserId(false), 2500);
    };
    // Password requirements matrix checks
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    const hasBonusLength = password.length >= 12;
    const hasNumberOrSpecial = hasNumber || hasSpecialChar;
    const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumberOrSpecial;
    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const getPasswordStrengthScore = () => {
        if (!password)
            return 0;
        let score = 0;
        if (hasMinLength)
            score++;
        if (hasUppercase)
            score++;
        if (hasLowercase)
            score++;
        if (hasNumber)
            score++;
        if (hasSpecialChar)
            score++;
        if (hasBonusLength)
            score++;
        return score;
    };
    const getPasswordStrengthLabel = () => {
        const score = getPasswordStrengthScore();
        if (score === 0)
            return '';
        if (score <= 2)
            return 'WEAK';
        if (score <= 4)
            return 'MEDIUM';
        return 'STRONG';
    };
    const getPasswordStrengthColor = () => {
        const label = getPasswordStrengthLabel();
        if (label === 'WEAK')
            return { bar: 'bg-rose-500', text: 'text-rose-500', width: 'w-1/3' };
        if (label === 'MEDIUM')
            return { bar: 'bg-amber-500', text: 'text-amber-500', width: 'w-2/3' };
        if (label === 'STRONG')
            return { bar: 'bg-emerald-500', text: 'text-emerald-500', width: 'w-full' };
        return { bar: '', text: '', width: 'w-0' };
    };
    // Step 1 Validation & Transition to Step 2
    const handleStep1Next = async () => {
        setError('');
        const newErrors = {};
        const isAm = language === 'am';

        const fnErr = validateName(firstName, isAm ? 'የመጀመሪያ ስም' : 'First name', true, isAm);
        if (fnErr) newErrors.firstName = fnErr;

        const mnErr = validateMiddleName(middleName, false, isAm);
        if (mnErr) newErrors.middleName = mnErr;

        const lnErr = validateName(lastName, isAm ? 'የአያት ስም' : 'Last name', true, isAm);
        if (lnErr) newErrors.lastName = lnErr;

        const emailErr = validateEmail(email, true, isAm);
        if (emailErr) newErrors.email = emailErr;

        const phoneErr = validatePhone(phone, phonePrefix, true, isAm);
        if (phoneErr) newErrors.phone = phoneErr;

        if (!birthMonth || !birthDay.trim() || !birthYear.trim()) {
            newErrors.dateOfBirth = isAm ? 'እባክዎ ወር ይምረጡና ትክክለኛ ቀንና ዓመት ያስገቡ.' : 'Please select month and enter valid day and year.';
        } else {
            const dobRes = validateDateOfBirth(dateOfBirth, 18);
            if (!dobRes.valid) {
                newErrors.dateOfBirth = dobRes.error;
            }
        }
        if (!gender) {
            newErrors.gender = isAm ? 'እባክዎ ጾታ ይምረጡ.' : 'Please select gender.';
        }

        // Ensure Ethiopian phone is strictly paired with Ethiopian nationality
        const isEt = isEthiopianPhone(phone, phonePrefix);
        if (isEt) {
            if (!nationality || (nationality.toLowerCase() !== 'ethiopian' && nationality.toLowerCase() !== 'ethiopia')) {
                setNationality('Ethiopian');
            }
        } else if (!nationality || !nationality.trim()) {
            newErrors.nationality = isAm ? 'እባክዎ ዜግነት ይምረጡ.' : 'Please select nationality.';
        }
        if (address && address.trim()) {
            const addrErr = validateText(address, isAm ? 'አድራሻ' : 'Address', 3, 255, false, isAm);
            if (addrErr) newErrors.address = addrErr;
        }

        // Verify email availability with backend
        if (!newErrors.email) {
            try {
                setLoading(true);
                const checkRes = await authApi.checkEmail(email.trim());
                // Only block if the backend explicitly says the email is taken
                if (checkRes.data && checkRes.data.success === false && checkRes.data.field === 'email') {
                    newErrors.email = '❌ This email address is already registered. Please use another email or sign in.';
                }
            } catch (err) {
                // Only block the user on an explicit 409 Conflict (email genuinely exists)
                if (err.response && err.response.status === 409) {
                    newErrors.email = '❌ This email address is already registered. Please use another email or sign in.';
                }
                // For network errors, timeouts, 500s, or any other failure:
                // Allow the user to proceed — the actual registration endpoint (Step 2)
                // will re-validate email uniqueness before creating the account.
            } finally {
                setLoading(false);
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            const firstKey = Object.keys(newErrors)[0];
            const el = document.getElementById(`field-${firstKey}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
            return;
        }
        setFieldErrors({});
        setCurrentStep(1); // Advance to Step 2: Account Credentials
    };

    // Step 2 Submission (Account Registration + OTP Dispatch -> Step 3)
    const handleStep2Submit = async () => {
        setError('');
        const newErrors = {};
        const isAm = language === 'am';

        if (!username.trim()) {
            newErrors.username = isAm ? 'የተጠቃሚ መለያ ያስፈልጋል.' : 'User ID / Username is required.';
        } else if (username.trim().length < 3) {
            newErrors.username = isAm ? 'የተጠቃሚ መለያ ቢያንስ 3 ፊደላት መሆን አለበት.' : 'Username must be at least 3 characters.';
        }

        const passErr = validatePasswordPolicy(password, isAm);
        if (passErr) {
            newErrors.password = passErr;
        } else if (!isPasswordStrong) {
            newErrors.password = isAm ? 'የይለፍ ቃል ከዚህ በታች ያሉትን ሁሉንም የደህንነት መስፈርቶች ማሟላት አለበት.' : 'Password must meet all security requirements below.';
        }

        const confErr = validatePasswordConfirmation(password, confirmPassword, isAm);
        if (confErr) {
            newErrors.confirmPassword = confErr;
        }

        // Pre-check username availability
        if (!newErrors.username) {
            try {
                setLoading(true);
                const checkUserRes = await authApi.checkUsername(username.trim());
                if (checkUserRes.data && checkUserRes.data.success === false && checkUserRes.data.field === 'username') {
                    newErrors.username = isAm ? 'ይህ የተጠቃሚ መለያ ቀድሞውኑ ተይዟል። እባክዎ ሌላ ይምረጡ.' : '❌ This username is already taken. Please choose another username.';
                }
            } catch (checkErr) {
                if (checkErr.response && checkErr.response.status === 409) {
                    newErrors.username = isAm ? 'ይህ የተጠቃሚ መለያ ቀድሞውኑ ተይዟል። እባክዎ ሌላ ይምረጡ.' : '❌ This username is already taken. Please choose another username.';
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setLoading(false);
            const firstKey = Object.keys(newErrors)[0];
            const el = document.getElementById(`field-${firstKey}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
            return;
        }
        setFieldErrors({});
        setLoading(true);
        const payload = {
            fullName: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
            firstName: firstName.trim(),
            middleName: middleName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            username: username.trim(),
            phone: `${phonePrefix} ${phone}`.trim(),
            gender,
            dateOfBirth,
            nationality,
            address: address.trim(),
            password,
            role: 'visitor'
        };
        try {
            const res = await authApi.register(payload);
            sessionStorage.setItem('signup_email', email.trim().toLowerCase());
            const returnedOtp = res.data?.otpCode || res.data?.data?.otpCode || res.otpCode;
            if (returnedOtp) {
                setDevOtpCode(returnedOtp);
            }
            setSuccess('Account created! A 6-digit verification code has been sent to your email.');
            setOtpTimer(60);
            setOtpCode(['', '', '', '', '', '']);
            setCurrentStep(2); // Advance to Step 3: Email OTP Verification
        }
        catch (err) {
            console.error('Registration failed:', err);
            const field = err.response?.data?.field;
            const respMsg = err.response?.data?.message || err.response?.data?.error;
            const msg = respMsg || getErrorMessage(err);
            const lowerMsg = (String(msg) + ' ' + String(respMsg || '')).toLowerCase();

            if (field === 'username' || lowerMsg.includes('username') || lowerMsg.includes('user id') || lowerMsg.includes('uq_users_username')) {
                const userErrMsg = isAm ? 'ይህ የተጠቃሚ መለያ ቀድሞውኑ ተይዟል። እባክዎ ሌላ ይምረጡ.' : '❌ This username is already taken. Please choose another username.';
                setFieldErrors({ username: userErrMsg });
                const el = document.getElementById('field-username');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                }
            }
            else if (field === 'email' || lowerMsg.includes('email') || lowerMsg.includes('uq_users_email')) {
                setFieldErrors({ email: msg });
                setCurrentStep(0); // Return to Step 1 to fix email
            }
            else {
                setError(msg || 'Registration failed. Please check your inputs and try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    // Step 3 OTP Verification Submission -> Advance to Welcome Screen (Step 4)
    const handleVerifyOtp = async (codeOverride) => {
        const code = typeof codeOverride === 'string' && codeOverride.length > 0 ? codeOverride : otpCode.join('');
        if (code.length < 6) {
            setError('Please enter the complete 6-digit verification code.');
            setOtpStatus('error');
            return;
        }
        setError('');
        setVerifyingOtp(true);
        setOtpStatus('idle');
        const targetEmail = (email || sessionStorage.getItem('signup_email') || '').trim().toLowerCase();
        if (!targetEmail) {
            setError('Email address not found. Please restart registration or go back.');
            setOtpStatus('error');
            setVerifyingOtp(false);
            return;
        }
        try {
            const res = await authApi.verifyOtp(targetEmail, code);
            if (res.data && (res.data.success || res.data.verified)) {
                setOtpVerified(true);
                setOtpStatus('success');
                setSuccess('Correct 6-digit verification code confirmed!');
                
                // If backend returned session tokens, save them immediately for seamless dashboard transition
                if (res.data?.token && res.data?.user) {
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    if (res.data.refreshToken) {
                        localStorage.setItem('refreshToken', res.data.refreshToken);
                    }
                }
                
                try {
                    if (login && password) {
                        await login(targetEmail, password);
                    }
                }
                catch (loginErr) {
                    console.warn('Auto login after OTP note:', loginErr);
                }
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('signup_'))
                        sessionStorage.removeItem(key);
                });
                // Delay 1.2s so the user clearly sees the green state before advancing to the Welcome screen
                setTimeout(() => {
                    setCurrentStep(3);
                }, 1200);
            }
            else {
                setError(res.data?.message || 'Invalid verification code. Please check your inbox and try again.');
                setOtpStatus('error');
            }
        }
        catch (err) {
            console.error('OTP verification error:', err);
            setError(getErrorMessage(err) || 'The verification code does not match the code sent to your email. Please check your inbox.');
            setOtpStatus('error');
        }
        finally {
            setVerifyingOtp(false);
        }
    };
    // Step 3 Resend OTP Code
    const handleResendOtp = async () => {
        const targetEmail = (email || sessionStorage.getItem('signup_email') || '').trim().toLowerCase();
        if (!targetEmail) {
            setError('Email address not found. Please restart registration or go back to Step 1.');
            return;
        }
        setResendingEmail(true);
        setResendSuccess(false);
        setError('');
        setOtpStatus('idle');
        setOtpCode(['', '', '', '', '', '']);
        try {
            const res = await authApi.resendVerification(targetEmail);
            setResendSuccess(true);
            setOtpTimer(45);
            const returnedOtp = res.data?.otpCode || res.data?.data?.otpCode || res.otpCode;
            if (returnedOtp) {
                setDevOtpCode(returnedOtp);
            }
            setTimeout(() => setResendSuccess(false), 5000);
        }
        catch (err) {
            setError(getErrorMessage(err) || 'Failed to resend verification code.');
        }
        finally {
            setResendingEmail(false);
        }
    };
    // OTP Input handlers
    const handleOtpChange = (index, value) => {
        if (!/^[0-9]*$/.test(value))
            return;
        const newOtp = [...otpCode];
        newOtp[index] = value.slice(-1);
        setOtpCode(newOtp);
        if (otpStatus !== 'idle') {
            setOtpStatus('idle');
            setError('');
        }
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput)
                nextInput.focus();
        }
        const fullCode = newOtp.join('');
        if (fullCode.length === 6 && newOtp.every(d => d !== '')) {
            handleVerifyOtp(fullCode);
        }
    };
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput)
                prevInput.focus();
        }
    };
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            const newOtp = [...otpCode];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = pasted[i] || '';
            }
            setOtpCode(newOtp);
            if (otpStatus !== 'idle') {
                setOtpStatus('idle');
                setError('');
            }
            const targetIdx = Math.min(pasted.length, 5);
            const el = document.getElementById(`otp-input-${targetIdx}`);
            if (el)
                el.focus();
            if (pasted.length === 6) {
                handleVerifyOtp(pasted);
            }
        }
    };
    return (<div className="signup-page-container flex min-h-screen w-full bg-[#f8fafc] dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans relative p-0 m-0 overflow-x-hidden transition-colors duration-300">
      
      {/* SCOPED THEME OVERRIDES */}
      <style>{`
        .signup-page-container {
          background-color: #f8fafc;
        }
        .signup-card-wrapper {
          background-color: #f8fafc;
          border: none !important;
          box-shadow: none !important;
        }
        .signup-sidebar {
          background-color: #ffffff;
          border-right: 1px solid #e2e8f0;
        }
        .signup-content-panel {
          background-color: #f8fafc;
        }

        [data-theme="dark"] .signup-page-container,
        .dark .signup-page-container {
          background-color: #070b13 !important;
        }
        [data-theme="dark"] .signup-card-wrapper,
        .dark .signup-card-wrapper {
          background-color: #070b13 !important;
          border: none !important;
          box-shadow: none !important;
        }
        [data-theme="dark"] .signup-sidebar,
        .dark .signup-sidebar {
          background-color: #060910 !important;
          border-right: 1px solid #172033 !important;
          border-bottom: 1px solid #172033 !important;
        }
        [data-theme="dark"] .signup-content-panel,
        .dark .signup-content-panel {
          background-color: #070b13 !important;
        }

        .signup-field-input {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        .signup-field-input::placeholder {
          color: #64748b !important;
        }
        .signup-field-input:focus {
          background-color: #ffffff !important;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15) !important;
        }

        .otp-input-error {
          border: 2px solid #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #ef4444 !important;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.45) !important;
        }

        .otp-input-success {
          border: 2px solid #10b981 !important;
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #10b981 !important;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.45) !important;
        }

        [data-theme="dark"] .signup-field-input,
        .dark .signup-field-input {
          background-color: #131d31 !important;
          border: 1px solid #334155 !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .signup-field-input::placeholder,
        .dark .signup-field-input::placeholder {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .signup-field-input:focus,
        .dark .signup-field-input:focus {
          background-color: #16223b !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25) !important;
        }
        [data-theme="dark"] option,
        .dark option {
          background-color: #131d31 !important;
          color: #ffffff !important;
        }

        .signup-inner-input {
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .signup-inner-input:focus {
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .btn-primary-vms {
          background-color: #2563eb !important;
          color: #ffffff !important;
          border: none !important;
        }
        .btn-primary-vms:hover {
          background-color: #1d4ed8 !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* Main Full-Size Edge-to-Edge Container */}
      <div className="signup-card-wrapper w-full min-h-screen flex flex-col lg:flex-row z-10 m-0 p-0 border-0 shadow-none">
        
        {/* Left Sidebar Stepper Panel */}
        <div className="signup-sidebar w-full lg:w-84 xl:w-96 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060910] shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white p-1 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="h-full w-full object-contain rounded-lg" onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = 'true';
                target.src = '/logo.png';
            }
        }}/>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{orgName}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Secure. Track. Manage.</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{t('signup.createAccount')}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed font-medium">
                {t('signup.registerDesc')}
              </p>
            </div>

            {/* Vertical Stepper List */}
            <div className="mt-8 space-y-6">
              {STEPS.map((stepItem, idx) => {
            const isCompleted = currentStep > idx;
            const isActive = currentStep === idx;
            return (<div key={idx} className="flex gap-4 items-start">
                    <div className="relative flex items-center justify-center shrink-0">
                      {isCompleted ? (<div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                          <Check className="h-4 w-4"/>
                        </div>) : isActive ? (<div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-sm">
                          {idx + 1}
                        </div>) : (<div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs">
                          {idx + 1}
                        </div>)}
                      
                      {idx < STEPS.length - 1 && (<div className="absolute top-7 left-[13px] w-[2px] h-[34px] bg-slate-200 dark:bg-slate-800"/>)}
                    </div>

                    <div>
                      <p className={`text-xs font-extrabold leading-tight ${isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {stepItem.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-medium">{stepItem.desc}</p>
                    </div>
                  </div>);
        })}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t('login.needHelp')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-semibold">{t('sidebar.feedbackSupport')}</p>
            <div className="mt-2 space-y-1 text-xxs font-bold text-slate-700 dark:text-slate-300">
              {orgPhone && <p>📞 {orgPhone}</p>}
              {orgEmail && <p>✉️ {orgEmail}</p>}
              {orgWebsite && (<p>
                  🌐{' '}
                  <a href={orgWebsite.startsWith('http') ? orgWebsite : `https://${orgWebsite}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {orgWebsite}
                  </a>
                </p>)}
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] mt-4 font-bold">
              © {new Date().getFullYear()} {orgName}. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="signup-content-panel flex-1 p-6 sm:p-8 md:p-12 flex flex-col justify-between relative min-w-0 bg-[#f8fafc] dark:bg-[#070b13]">
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between">
            {/* Header Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            {/* Brand Logo & Title on Register Form */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="h-full w-full object-contain rounded-lg" onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = 'true';
                target.src = '/logo.png';
            }
        }}/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t('sidebar.visitorRegistration')}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {t('sidebar.visitorPortal')}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold tracking-wide">
                  {t('signup.registerDesc')}
                </p>
              </div>
            </div>

            {/* Theme switcher + Language switcher + Back to Sign In Styled Button */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageDropdown variant="dark"/>
              <Link to="/login" id="back-to-signin-btn" className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 border border-slate-300/80 shadow-sm hover:shadow dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white dark:border-slate-700 active:scale-95 cursor-pointer">
                <ArrowLeft className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform group-hover:-translate-x-1"/>
                <span>{t('signup.signIn')}</span>
              </Link>
            </div>
          </div>

          {/* Alert Banners */}
          <div className="flex-1 flex flex-col justify-center">
            {error && (<div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"/>
                <span>{error}</span>
              </div>)}
            {success && currentStep !== 3 && (<div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"/>
                <span>{success}</span>
              </div>)}

            <AnimatePresence mode="wait">
              
              {/* ========================================================================= */}
              {/* === STEP 1: PERSONAL INFORMATION                                      === */}
              {/* ========================================================================= */}
              {currentStep === 0 && (<motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('signup.step')} 1 {t('signup.of')} 3</span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{t('signup.personalInfo')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('signup.personalInfoDesc')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.firstName ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.firstName')} *</label>
                      <input id="field-firstName" type="text" placeholder={t('signup.firstName')} className={`signup-field-input w-full px-3.5 py-2.5 rounded-lg text-xs font-bold outline-none ${fieldErrors.firstName ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={firstName} onChange={e => { setFirstName(e.target.value); clearFieldError('firstName'); }}/>
                      {fieldErrors.firstName && (
                        <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                          <span>{fieldErrors.firstName}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.middleName ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.middleName')}</label>
                      <input type="text" placeholder={t('signup.middleName')} className={`signup-field-input w-full px-3.5 py-2.5 rounded-lg text-xs font-bold outline-none ${fieldErrors.middleName ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={middleName} onChange={e => { setMiddleName(e.target.value); clearFieldError('middleName'); }}/>
                      {fieldErrors.middleName && (
                        <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                          <span>{fieldErrors.middleName}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.lastName ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.lastName')} *</label>
                      <input id="field-lastName" type="text" placeholder={t('signup.lastName')} className={`signup-field-input w-full px-3.5 py-2.5 rounded-lg text-xs font-bold outline-none ${fieldErrors.lastName ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={lastName} onChange={e => { setLastName(e.target.value); clearFieldError('lastName'); }}/>
                      {fieldErrors.lastName && (
                        <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                          <span>{fieldErrors.lastName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.email ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.email')} *</label>
                      <input id="field-email" type="email" placeholder={t('signup.email')} className={`signup-field-input w-full px-3.5 py-2.5 rounded-lg text-xs font-bold outline-none ${fieldErrors.email ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={email} onChange={e => { setEmail(e.target.value); clearFieldError('email'); }}/>
                      {fieldErrors.email && (<p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                          <span>{fieldErrors.email}</span>
                        </p>)}
                    </div>
                    <div>
                      <CountryPhoneInput
                        id="field-phone"
                        label={t('signup.phone')}
                        required
                        value={phone}
                        dialCode={phonePrefix}
                        onDialCodeChange={handleDialCodeChange}
                        onChange={handlePhoneChange}
                        error={fieldErrors.phone}
                        placeholder="911 234 567"
                      />
                    </div>
                  </div>

                  {/* Google-Style Basic Information (Birthday & Gender) */}
                  <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">{t('signup.personalInfo')}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('signup.personalInfoDesc')}</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('signup.required')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Birthday: Month, Day, Year */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`block text-[10px] font-extrabold uppercase tracking-wider ${fieldErrors.dateOfBirth ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {t('signup.dateOfBirth')} *
                          </label>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            Min. 18 years
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {/* Month Dropdown */}
                          <div>
                            <select id="field-birthMonth" className={`signup-field-input w-full px-2 py-2.5 rounded-lg text-xs font-bold outline-none cursor-pointer ${fieldErrors.dateOfBirth ? 'border-2 border-rose-500 bg-rose-50/50' : ''} ${!birthMonth ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`} value={birthMonth} onChange={e => {
                                setBirthMonth(e.target.value);
                                clearFieldError('dateOfBirth');
                            }}>
                              <option value="" disabled hidden>{t('signup.month')}</option>
                              <option value="01">01 - Jan</option>
                              <option value="02">02 - Feb</option>
                              <option value="03">03 - Mar</option>
                              <option value="04">04 - Apr</option>
                              <option value="05">05 - May</option>
                              <option value="06">06 - Jun</option>
                              <option value="07">07 - Jul</option>
                              <option value="08">08 - Aug</option>
                              <option value="09">09 - Sep</option>
                              <option value="10">10 - Oct</option>
                              <option value="11">11 - Nov</option>
                              <option value="12">12 - Dec</option>
                            </select>
                          </div>

                          {/* Day Input */}
                          <div>
                            <input id="field-birthDay" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} placeholder={t('signup.day')} className={`signup-field-input w-full px-3 py-2.5 rounded-lg text-xs font-bold outline-none text-center ${fieldErrors.dateOfBirth ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={birthDay} onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 2) {
                                    setBirthDay(val);
                                    clearFieldError('dateOfBirth');
                                }
                            }}/>
                          </div>

                          {/* Year Input */}
                          <div>
                            <input id="field-birthYear" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder={t('signup.year')} className={`signup-field-input w-full px-3 py-2.5 rounded-lg text-xs font-bold outline-none text-center ${fieldErrors.dateOfBirth ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={birthYear} onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 4) {
                                    setBirthYear(val);
                                    clearFieldError('dateOfBirth');
                                }
                            }}/>
                          </div>
                        </div>

                        {/* Live Age Indicator / Validation Pill */}
                        {dobValidation && !dobValidation.partial && (
                          <div className="mt-1.5 animate-in fade-in duration-200">
                            {dobValidation.valid ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Age: <strong>{dobValidation.age} years old</strong> (Eligible, ≥ 18)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{dobValidation.error}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {fieldErrors.dateOfBirth && (!dobValidation || dobValidation.partial || dobValidation.valid) && (
                          <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                            <span>{fieldErrors.dateOfBirth}</span>
                          </p>
                        )}
                      </div>

                      {/* Gender Dropdown */}
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.gender ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {t('signup.gender')} *
                        </label>
                        <select id="field-gender" className={`signup-field-input w-full px-3.5 py-2.5 rounded-lg text-xs font-bold outline-none cursor-pointer ${fieldErrors.gender ? 'border-2 border-rose-500 bg-rose-50/50' : ''} ${!gender ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`} value={gender} onChange={e => {
                setGender(e.target.value);
                clearFieldError('gender');
            }}>
                          <option value="" disabled hidden>{t('signup.selectGender')}</option>
                          <option value="Female">{t('signup.female')}</option>
                          <option value="Male">{t('signup.male')}</option>
                          <option value="Rather not say">Rather not say</option>
                          <option value="Custom">{t('signup.other')}</option>
                        </select>
                        {fieldErrors.gender && (<p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                            <span>{fieldErrors.gender}</span>
                          </p>)}
                      </div>
                    </div>

                    {/* Google Style Info Toggle */}
                    <div className="pt-1">
                      <button type="button" onClick={() => setShowBirthdayInfo(!showBirthdayInfo)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer">
                        Why we ask for your birthday and gender
                      </button>
                      {showBirthdayInfo && (<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          Your birthday and gender are required for official visitor verification, facility access safety compliance, and emergency building identification.
                        </motion.div>)}
                    </div>
                  </div>

                  {/* Nationality & Address Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <CountryNationalitySelect
                        id="field-nationality"
                        label={t('signup.nationality')}
                        required
                        value={nationality}
                        onChange={handleNationalityChange}
                        error={fieldErrors.nationality}
                        placeholder="Search & select nationality..."
                      />
                      {isEthiopianPhone(phone, phonePrefix) && (
                        <p className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>Automatically selected as Ethiopia for Ethiopian phone (+251)</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.address ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.address')} ({t('signup.optional')})</label>
                      <input type="text" placeholder="City, Subcity, Street" className={`signup-field-input w-full px-3.5 py-2.5 rounded-lg text-xs font-bold outline-none ${fieldErrors.address ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={address} onChange={e => { setAddress(e.target.value); clearFieldError('address'); }}/>
                      {fieldErrors.address && (
                        <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                          <span>{fieldErrors.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 1 Action Buttons */}
                  <div className="pt-6 flex items-center justify-between">
                    <button type="button" onClick={handleResetForm} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                      Clear Form
                    </button>
                    <button type="button" onClick={handleStep1Next} disabled={loading} className="btn-primary-vms px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/25 hover:shadow-blue-600/40 transition-all cursor-pointer">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <>{t('signup.next')} <ArrowRight className="h-4 w-4"/></>}
                    </button>
                  </div>
                </motion.div>)}

              {/* ========================================================================= */}
              {/* === STEP 2: ACCOUNT CREDENTIALS (WITH REFERENCE BADGE & 2-COL MATRIX) === */}
              {/* ========================================================================= */}
              {currentStep === 1 && (<motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('signup.step')} 2 {t('signup.of')} 3</span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{t('signup.accountCredentials')}</h3>
                    </div>
                    {/* HORIZONTAL REFERENCE NUMBER BADGE */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-slate-700 rounded-xl shrink-0 shadow-sm">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('signup.referenceCode')}</span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider">{referenceCode}</span>
                    </div>
                  </div>

                  {/* KEY ICON HEADER CONTAINER */}
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm">
                    <Key className="h-7 w-7"/>
                  </div>

                  {/* 1. READ-ONLY EMAIL DISPLAY FIELD */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">{t('signup.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 dark:text-blue-400 pointer-events-none z-10"/>
                      <input type="email" readOnly value={email || 'user@example.com'} className="signup-field-input w-full pl-10 pr-28 py-3 rounded-xl text-xs font-black text-slate-900 dark:text-white outline-none cursor-not-allowed opacity-95"/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-white bg-emerald-600 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm z-10">
                        CONFIRMED
                      </span>
                    </div>
                  </div>

                  {/* 2. USER ID FIELD */}
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.username ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.username')} *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10"/>
                      <input id="field-username" type="text" placeholder={t('signup.username')} className={`signup-field-input w-full pl-10 pr-20 py-3 rounded-xl text-xs font-bold outline-none ${fieldErrors.username ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={username} onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')); clearFieldError('username'); }}/>
                      <button type="button" onClick={() => handleCopyUserId(username)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs flex items-center gap-1 font-bold cursor-pointer z-10">
                        <Copy className="h-3.5 w-3.5"/>
                        {copiedUserId ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    {fieldErrors.username && (
                      <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                        <span>{fieldErrors.username}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">{t('signup.accountCredentialsDesc')}</p>
                  </div>

                  {/* 3. PASSWORD FIELD (FULL WIDTH) */}
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.password ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.password')} *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10"/>
                      <input type={showPassword ? 'text' : 'password'} placeholder={t('signup.password')} className={`signup-field-input w-full pl-10 pr-10 py-3 rounded-xl text-xs font-bold outline-none ${fieldErrors.password ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={password} onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}/>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer z-10">
                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* 4. PASSWORD STRENGTH BAR & 5. REQUIREMENTS CHECKLIST */}
                  <div className="bg-slate-50 dark:bg-[#131d31] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">{t('signup.passwordStrength')}</span>
                        <span className={`text-xs font-extrabold ${getPasswordStrengthColor().text}`}>{getPasswordStrengthLabel() || 'STRONG'}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getPasswordStrengthColor().bar || 'bg-emerald-500'} ${getPasswordStrengthColor().width || 'w-full'}`}/>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('signup.passwordStrength')}:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-extrabold">
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>✓</span>
                          <span>{t('signup.minChars')}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasUppercase ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>✓</span>
                          <span>One uppercase letter (A-Z)</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasLowercase ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>✓</span>
                          <span>One lowercase letter (a-z)</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>✓</span>
                          <span>One number (0-9)</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasSpecialChar ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>✓</span>
                          <span>One special character (!@#$...)</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasBonusLength ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>✓</span>
                          <span>12+ characters (bonus)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. CONFIRM PASSWORD FIELD (BELOW REQUIREMENTS BOX) */}
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${fieldErrors.confirmPassword ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{t('signup.confirmPassword')} *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10"/>
                      <input type={showConfirmPassword ? 'text' : 'password'} placeholder={t('signup.confirmPassword')} className={`signup-field-input w-full pl-10 pr-10 py-3 rounded-xl text-xs font-bold outline-none ${fieldErrors.confirmPassword ? 'border-2 border-rose-500 bg-rose-50/50' : ''}`} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}/>
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer z-10">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500"/>
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                    {/* PASSWORDS MATCH INDICATOR */}
                    {passwordsMatch && (<p className="mt-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>✓ {t('signup.passwordsMatch')}</span>
                      </p>)}
                  </div>

                  {/* Step 2 Action Buttons */}
                  <div className="pt-6 flex justify-between items-center gap-4">
                    <button type="button" onClick={() => setCurrentStep(0)} className="px-5 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
                      <ArrowLeft className="h-4 w-4"/> {t('signup.back')}
                    </button>
                    <button type="button" onClick={handleStep2Submit} disabled={loading} className="btn-primary-vms px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/25 hover:shadow-blue-600/40 transition-all cursor-pointer">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <>{t('signup.next')} <ArrowRight className="h-4 w-4"/></>}
                    </button>
                  </div>
                </motion.div>)}

              {/* ========================================================================= */}
              {/* === STEP 3: EMAIL OTP VERIFICATION (MATCHING SCREENSHOT 1)           === */}
              {/* ========================================================================= */}
              {currentStep === 2 && (<motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                  {/* TOP SHIELD CIRCLE ICON MATCHING SCREENSHOT 1 */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-md">
                    <Shield className="h-8 w-8"/>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('signup.emailOTP')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {t('signup.otpSentTo')}:
                    </p>
                  </div>

                  {/* EMAIL DISPLAY BOX MATCHING SCREENSHOT 1 */}
                  <div className="bg-slate-50 dark:bg-[#131d31] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 max-w-sm mx-auto flex items-center justify-center gap-2.5 text-xs font-extrabold text-slate-900 dark:text-white shadow-sm">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                    <span>{email || 'user@example.com'}</span>
                  </div>

                  {/* 6-DIGIT OTP BOXES MATCHING SCREENSHOT 1 */}
                  <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 my-6 max-w-full overflow-hidden px-1" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, idx) => (<input key={idx} id={`otp-input-${idx}`} type="text" maxLength={1} className={`w-10 h-12 sm:w-12 sm:h-14 max-w-[48px] text-center text-lg sm:text-xl font-black rounded-xl border-2 transition-all outline-none ${otpStatus === 'error'
                    ? 'otp-input-error'
                    : otpStatus === 'success'
                        ? 'otp-input-success'
                        : 'signup-field-input focus:border-blue-500'}`} value={digit} onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleOtpKeyDown(idx, e)}/>))}
                  </div>



                  {/* REAL-TIME DYNAMIC STATUS BADGE */}
                  {resendSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 max-w-sm mx-auto shadow-sm animate-pulse">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>New 6-digit verification code sent to your email!</span>
                    </div>
                  )}

                  {otpStatus === 'error' && (<div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 max-w-sm mx-auto shadow-sm animate-pulse">
                      <AlertCircle className="h-4 w-4 shrink-0"/>
                      <span>{error || 'Invalid 6-digit code. Please enter the code sent to your email.'}</span>
                    </div>)}

                  {otpStatus === 'success' && (<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 max-w-sm mx-auto shadow-sm animate-pulse">
                      <CheckCircle className="h-4 w-4 shrink-0"/>
                      <span>✓ Correct verification code! Creating account...</span>
                    </div>)}

                  {/* DEV TEST ASSISTANT / AUTO-FILL HINT */}
                  {devOtpCode && (
                    <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-2.5 max-w-sm mx-auto flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Shield className="h-3.5 w-3.5 text-blue-500" />
                        Code: <strong className="font-black text-sm tracking-widest text-blue-600 dark:text-blue-400">{devOtpCode}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = String(devOtpCode).split('');
                          setOtpCode(digits);
                          handleVerifyOtp(devOtpCode);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black tracking-wide cursor-pointer shadow-sm transition-colors"
                      >
                        Auto-fill & Verify
                      </button>
                    </div>
                  )}

                  {/* TIMER ROW */}
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 space-y-1">
                    <div>
                      {t('signup.otpExpires')} <strong className="text-blue-600 dark:text-blue-400 font-black">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                      Didn't see the email? Please check your <strong>Spam</strong>, <strong>Updates</strong>, or <strong>Promotions</strong> folder.
                    </p>
                  </div>

                  {/* RESEND LINK */}
                  <div>
                    <button 
                      type="button" 
                      onClick={handleResendOtp} 
                      disabled={resendingEmail || otpTimer > 0} 
                      className={`text-xs font-extrabold flex items-center justify-center gap-1.5 mx-auto transition-all ${
                        otpTimer > 0 
                          ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                          : resendingEmail
                            ? 'text-blue-500 cursor-wait'
                            : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer active:scale-95'
                      }`}
                    >
                      {resendingEmail ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600"/>
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5"/>
                          <span>{t('signup.resendOTP')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* PRIMARY BUTTON MATCHING SCREENSHOT 1 */}
                  <div className="pt-4 space-y-3">
                    <button type="button" onClick={() => handleVerifyOtp()} disabled={verifyingOtp || otpCode.join('').length < 6} className="btn-primary-vms w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all cursor-pointer">
                      {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-5 w-5"/>}
                      {t('signup.verify')} & {t('signup.createAccount')}
                    </button>

                    <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer">
                      ← {t('signup.back')}
                    </button>
                  </div>
                </motion.div>)}

              {/* ========================================================================= */}
              {/* === STEP 4: SUCCESS WELCOME SCREEN (MATCHING SCREENSHOT 2)            === */}
              {/* ========================================================================= */}
              {currentStep === 3 && (<motion.div key="step-3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center py-4">
                  {/* GREEN CIRCLE CHECK ICON */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shadow-lg">
                    <CheckCircle className="h-9 w-9"/>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('signup.registrationSuccess')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {t('signup.welcomeMessage')}
                    </p>
                  </div>

                  {/* CARD 1: YOUR ACCOUNT DETAILS */}
                  <div className="bg-slate-50 dark:bg-[#131d31] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left space-y-3 shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('signup.accountCredentials')}</p>
                    <div className="space-y-2 text-xs font-bold">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{t('signup.email')}</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{t('signup.username')}</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{t('signup.referenceCode')}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-extrabold tracking-wider">{referenceCode}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Role</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{t('sidebar.visitor')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Email Status</span>
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xxs font-extrabold px-3 py-1 rounded-md">{t('signup.verify')}d</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: YOU CAN SIGN IN USING */}
                  <div className="bg-slate-50 dark:bg-[#131d31] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left space-y-2 shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('signup.signIn')}:</p>
                    <div className="space-y-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0"/>
                        <span>{t('signup.email')}: <strong className="text-slate-900 dark:text-white">{email}</strong></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0"/>
                        <span>{t('signup.username')}: <strong className="text-slate-900 dark:text-white">{username}</strong></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0"/>
                        <span>{t('signup.password')}: <strong className="text-slate-900 dark:text-white">••••••••</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-4 space-y-3">
                    <button type="button" onClick={() => navigate('/visitor/dashboard')} className="btn-primary-vms w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all cursor-pointer">
                      <ArrowRight className="h-4 w-4"/> {t('signup.goToDashboard')}
                    </button>
                    
                    <button type="button" onClick={() => navigate('/login')} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer">
                      {t('signup.signIn')}
                    </button>
                  </div>
                </motion.div>)}

            </AnimatePresence>
          </div>
          </div>
        </div>

      </div>
    </div>);
}
