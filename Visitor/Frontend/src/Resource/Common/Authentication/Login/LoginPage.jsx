import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Eye, EyeOff, CheckCircle, Shield, Phone, Mail, User as UserIcon, Lock, Globe, AlertTriangle } from 'lucide-react';
import { getRoleLanding, ROUTES } from '../../../../config/routes';
import { useAuth, BLOCKED_ACCOUNT_STATUSES } from '../../../../contexts/AuthContext';
import { useOrganization } from '../../../../contexts/OrganizationContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import LanguageDropdown from '../../../../components/common/LanguageDropdown';
import ThemeToggle from '../../../../components/ThemeToggle/ThemeToggle';
import { useTheme } from '../../../../theme/ThemeContext';
import { useEnterpriseForm } from '../../../../hooks/useEnterpriseForm';
import { ValidationRules } from '../../../../services/validationService';
import FieldError from '../../../../components/common/FieldError';
import { useNotification } from '../../../../contexts/NotificationContext';

export default function LoginPage() {
    const { notify } = useNotification();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const location = useLocation();
    const isRedirectedBlocked = location.search.includes('blocked=true');
    const [errorTitle, setErrorTitle] = useState(() => (
        isRedirectedBlocked ? 'Account Status Notice' : 'Authentication Notice'
    ));
    const [error, setError] = useState(() => (
        isRedirectedBlocked ? 'This user is blocked. Please call the administrator.' : ''
    ));
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const attemptTimestampsRef = useRef([]);
    const { user, login } = useAuth();
    const { organization, logoUrl, orgName, orgEmail, orgPhone, orgWebsite } = useOrganization();
    const { language, setLanguage, t } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    // Security: Clean up any previously cached credentials on mount
    useEffect(() => {
        try {
            localStorage.removeItem('remembered_identifier');
            sessionStorage.removeItem('login_identifier');
        }
        catch {
            // ignore
        }
    }, []);
    useEffect(() => {
        if (user) {
            const statusUpper = String(user.accountStatus || user.status || '').toUpperCase();
            if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
                return;
            }
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);
    const { values, errors, handleChange, handleBlur, handleSubmit, setBackendErrors, isSubmitting, } = useEnterpriseForm({
        initialValues: {
            identifier: '',
            password: '',
        },
        validationSchema: {
            identifier: (val) => ValidationRules.required(val, 'User ID or Email'),
            password: (val) => ValidationRules.required(val, 'Password'),
        },
        onSubmit: async (formValues) => {
            setError('');
            setSuccess('');
            const now = Date.now();
            const recentAttempts = attemptTimestampsRef.current.filter((t) => now - t < 60000);
            if (recentAttempts.length >= 7) {
                const limitMsg = t('login.tooManyRequests');
                setError(limitMsg);
                notify.warning(limitMsg);
                return;
            }
            attemptTimestampsRef.current = [...recentAttempts, now];
            setLoading(true);
            try {
                const loginRes = await login(formValues.identifier.trim(), formValues.password, rememberMe);
                const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
                const parsed = stored ? JSON.parse(stored) : null;
                const statusUpper = String(parsed?.accountStatus || parsed?.status || '').toUpperCase();
                if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
                    try {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        sessionStorage.removeItem('token');
                    } catch {}
                    const blockedMsg = 'This user is blocked. Please call the administrator.';
                    setError(blockedMsg);
                    notify.error(blockedMsg);
                    return;
                }
                const mustChange = Boolean(loginRes?.passwordChangeRequired ||
                    parsed?.passwordChangeRequired ||
                    parsed?.firstLoginRequired);
                if (mustChange) {
                    const tempMsg = t('login.tempCredentials');
                    setSuccess(tempMsg);
                    notify.info(tempMsg);
                    setTimeout(() => {
                        navigate(ROUTES.PUBLIC.CHANGE_PASSWORD, { replace: true });
                    }, 400);
                    return;
                }
                const accessMsg = t('login.accessGranted');
                setSuccess(accessMsg);
                notify.success(accessMsg);
                if (parsed) {
                    setTimeout(() => {
                        navigate(getRoleLanding(parsed.role, parsed));
                    }, 600);
                }
                else {
                    navigate('/dashboard');
                }
            }
            catch (err) {
                let rawMsg = '';
                if (typeof err.response?.data?.message === 'string') {
                    rawMsg = err.response.data.message;
                } else if (typeof err.response?.data?.error === 'string') {
                    rawMsg = err.response.data.error;
                } else if (typeof err.message === 'string') {
                    rawMsg = err.message;
                }

                const isBlockedErr = err.code === 'ACCOUNT_BLOCKED' ||
                                     err.isBlocked ||
                                     err.response?.data?.code === 'ACCOUNT_BLOCKED' ||
                                     err.response?.data?.isBlocked ||
                                     (err.response?.status === 403 && (
                                         rawMsg.toLowerCase().includes('block') ||
                                         rawMsg.toLowerCase().includes('suspend') ||
                                         rawMsg.toLowerCase().includes('lock') ||
                                         rawMsg.toLowerCase().includes('deactivat') ||
                                         rawMsg.toLowerCase().includes('denied')
                                     ));

                let calculatedTitle = 'Authentication Notice';
                let errorMsg = '';
                if (isBlockedErr) {
                    calculatedTitle = 'Account Status Notice';
                    errorMsg = 'This user is blocked. Please call the administrator.';
                } else if (err.response?.status === 403) {
                    calculatedTitle = 'Access Restricted';
                    errorMsg = rawMsg || 'Access Denied: Account is restricted. Please contact administrator.';
                } else if (err.response?.status === 429 || err.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
                    calculatedTitle = 'Rate Limit Notice';
                    errorMsg = t('login.rateLimited') || 'Too many attempts. Please wait a moment.';
                } else if (err.response?.status === 401) {
                    calculatedTitle = 'Authentication Notice';
                    errorMsg = rawMsg || t('login.invalidCredentials') || 'Invalid credentials. Please verify your User ID/Email and password.';
                } else if (err.response?.status === 404) {
                    calculatedTitle = 'Service Notice';
                    errorMsg = 'Authentication service is reaching the server. Please check your credentials or retry.';
                } else if (err.code === 'ERR_NETWORK' || !err.response) {
                    calculatedTitle = 'Service Status Notice';
                    errorMsg = 'Server is currently waking up or unavailable. Please try again shortly.';
                } else if (/something went wrong on our end|quota|restricted/i.test(rawMsg)) {
                    calculatedTitle = 'Service Status Notice';
                    errorMsg = 'The database service is currently reconnecting or undergoing maintenance. Please retry in a moment.';
                } else if (rawMsg) {
                    calculatedTitle = 'Authentication Notice';
                    errorMsg = rawMsg;
                } else {
                    calculatedTitle = 'Authentication Notice';
                    errorMsg = t('login.invalidCredentials') || 'Invalid credentials. Please check your User ID/Email and password.';
                }

                const finalError = typeof errorMsg === 'string' ? errorMsg : 'Invalid credentials. Please check your user ID and password.';
                setErrorTitle(calculatedTitle);
                setError(finalError);
                notify.error(finalError);
                setBackendErrors(err);
            }
            finally {
                setLoading(false);
            }
        },
    });
    const handleKeyDown = (e) => {
        if (e.getModifierState && e.getModifierState('CapsLock')) {
            setCapsLockOn(true);
        }
        else {
            setCapsLockOn(false);
        }
    };
    return (
      <div className={`flex min-h-screen ${isDark ? 'bg-[#070b13] text-slate-100' : 'bg-slate-100 text-slate-800'} font-sans relative overflow-hidden login-page-root`}>
      {/* ═══════════════════════════════════════════════════
            LEFT BRANDING PANEL
           ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden dark-panel login-branding-panel">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/vms-lobby.png" alt="Enterprise VMS Lobby" className="w-full h-full object-cover object-center scale-[1.02] filter contrast-[1.05] brightness-[0.85]"/>
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-[#070b13]/90 via-[#070b13]/60 to-[#070b13]/90' : 'bg-gradient-to-r from-slate-900/60 via-slate-900/35 to-slate-900/60'}`}/>
        </div>

        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white rounded-xl shadow-md border border-slate-200">
              <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="w-9 h-9 object-contain rounded-lg" onError={(e) => {
            e.target.src = '/logo.png';
        }}/>
            </div>
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">
              {orgName || 'IT park'}
            </span>
          </div>
        </div>

        {/* CENTERPIECE: Floating Glass Card with Y-Direction Animation */}
        <div className="relative z-10 px-8 lg:px-12 py-4">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{
              opacity: 1,
              y: [0, -10, 0],
            }}
            transition={{
              opacity: { duration: 0.8, ease: 'easeOut' },
              y: {
                duration: 5,
                repeat: Infinity,
                repeatType: 'easeInOut',
                ease: 'easeInOut',
              },
            }}
            whileHover={{ y: -14, transition: { duration: 0.25 } }}
            className="group relative max-w-lg cursor-default"
          >
            {/* Ambient Multi-Hue Radiant Glow Aura */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-emerald-500/25 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Glassmorphism Card Frame */}
            <div className={`relative rounded-3xl p-8 sm:p-9 backdrop-blur-2xl transition-all duration-300 space-y-5 login-left-card ${
              isDark
                ? 'bg-slate-950/75 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/10'
                : 'bg-white/92 border border-slate-200 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/5'
            }`}>
              
              {/* Top Security Status Pill */}
              <div className="flex items-center justify-between gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-inner ${
                  isDark
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="uppercase text-[10px] tracking-wider font-extrabold">
                    Live Security Shield
                  </span>
                </div>

                <div className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
                  isDark
                    ? 'text-slate-300 bg-slate-900/60 border-slate-800/80'
                    : 'text-slate-700 bg-slate-100 border-slate-300'
                }`}>
                  <Shield className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span className="font-semibold">ISO 27001 Verified</span>
                </div>
              </div>

              {/* Card Title with Attractive Large Animated Multi-Hue Gradients */}
              <div className="relative pt-1 sm:pt-2">
                {/* Ambient Soft Luminous Backdrop Aura */}
                <div className={`absolute -inset-x-3 -inset-y-2 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 blur-2xl ${isDark ? 'opacity-60' : 'opacity-25'} pointer-events-none rounded-3xl vms-aura-pulse`} />

                {/* Subtitle Eyebrow Badge */}
                <div className="relative flex items-center gap-2 mb-2 sm:mb-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border shadow-sm backdrop-blur-md ${
                    isDark
                      ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 border-cyan-400/30 text-cyan-300'
                      : 'bg-cyan-50 border-cyan-300 text-cyan-900 font-black'
                  }`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
                    </span>
                    Next-Gen Platform
                  </span>
                </div>

                {/* Large Hero Headline with Multi-Color Shifting Animated Gradients */}
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.15] select-none">
                  {/* First Segment: Electric Cyan to Indigo to Purple Gradient */}
                  <div className="block leading-tight pb-0.5">
                    <motion.span
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        display: 'inline-block',
                      }}
                      className="vms-animated-gradient-text-1 drop-shadow-[0_4px_22px_rgba(56,189,248,0.4)]"
                    >
                      {language === 'am' ? 'ደህንነቱ የተጠበቀ የጎብኝዎች አስተዳደር' : 'Secure Visitor Management'}
                    </motion.span>
                  </div>

                  {/* Second Segment: Radiant Fuchsia to Neon Coral to Golden Amber Gradient */}
                  <div className="block mt-1 sm:mt-1.5 leading-tight">
                    <motion.span
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
                      style={{
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        display: 'inline-block',
                      }}
                      className="vms-animated-gradient-text-2 drop-shadow-[0_4px_22px_rgba(244,114,182,0.4)]"
                    >
                      {language === 'am' ? '& የማሰብ ችሎታ ያለው የመዳረሻ ቁጥጥር' : '& Intelligent Access Control'}
                    </motion.span>
                  </div>
                </h1>
              </div>

              {/* Card Subtitle / Description */}
              <p className={`text-sm leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                {t('login.enterpriseDesc')}
              </p>

              {/* Feature Chips / Verification Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100/70'
                }`}>
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t('login.encrypted')}</span>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isDark
                    ? 'bg-sky-500/10 border-sky-500/25 text-sky-300 hover:bg-sky-500/20'
                    : 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100/70'
                }`}>
                  <CheckCircle className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{t('login.compliant')}</span>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isDark
                    ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100/70'
                }`}>
                  <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Zero-Trust Verification</span>
                </div>
              </div>

            </div>
          </motion.div>
        </div>

        <div className={`relative z-10 p-12 pt-0 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-200'}`}>
          <span className={`font-mono text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>v2.4.0 • Enterprise Security Grade</span>
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>99.99% Cloud Service Uptime</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
            RIGHT LOGIN FORM PANEL
           ═══════════════════════════════════════════════════ */}
      <div
        className={`w-full lg:w-[48%] flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10 relative overflow-hidden login-right-panel auth-outer-panel ${
          isDark ? 'bg-[#070b14]' : 'bg-[#EEF2F6]'
        }`}
        style={{ backgroundColor: isDark ? '#070b14' : '#EEF2F6' }}
      >
        {/* Subtle Ambient Radial Lighting for Visual Depth (Grid lines overlay completely removed) */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDark
              ? 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(99,102,241,0.18),transparent_65%),radial-gradient(ellipse_60%_60%_at_80%_90%,rgba(168,85,247,0.12),transparent_60%)]'
              : 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(99,102,241,0.08),transparent_65%),radial-gradient(ellipse_60%_60%_at_80%_90%,rgba(168,85,247,0.05),transparent_60%)]'
          }`}
        />

        {/* Theme Toggle & Language Dropdown Selector */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2.5">
          <ThemeToggle />
          <LanguageDropdown variant={isDark ? 'dark' : 'light'} />
        </div>

        <div className="w-full max-w-md relative z-10 space-y-8">
          {/* Subtle Ambient Back-Glow for Elevated Depth */}
          <div
            className={`absolute -inset-1.5 rounded-3xl blur-xl pointer-events-none transition-opacity ${
              isDark
                ? 'bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-blue-500/20 opacity-75'
                : 'bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-blue-500/10 opacity-60'
            }`}
          />

          {/* Elevated Inner Card with Distinct Background & Tactile Surface */}
          <div
            className={`relative rounded-3xl p-6 sm:p-9 backdrop-blur-2xl transition-all duration-300 login-form-card auth-form-card ${
              isDark
                ? 'bg-gradient-to-b from-[#141d33] via-[#0f172a] to-[#0a1020] border border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] hover:border-indigo-500/40 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(99,102,241,0.2)]'
                : 'bg-white border border-slate-300/90 shadow-[0_20px_45px_-10px_rgba(15,23,42,0.12),0_8px_20px_-6px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.04)] hover:border-indigo-400 hover:shadow-[0_25px_50px_-10px_rgba(15,23,42,0.16),0_0_25px_rgba(99,102,241,0.15)]'
            }`}
          >
            {/* Top Luminous Accent Edge */}
            <div
              className={`absolute top-0 left-8 right-8 h-[2px] rounded-full ${
                isDark
                  ? 'bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-indigo-600/70 to-transparent'
              }`}
            />

            {/* Form Header */}
            <div className="text-center mb-6 pt-1">
              <h2 className={`text-2xl font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-slate-900 font-black'}`}>
                {t('login.signIn')}
              </h2>
              <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('login.enterCredentials')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate autoComplete="off">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (<motion.div initial={{ opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-4 text-xs text-rose-200 font-bold flex items-start gap-3 shadow-xl shadow-rose-950/50 backdrop-blur-md">
                    <div className="p-1.5 bg-rose-500/25 border border-rose-500/50 rounded-lg text-rose-300 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4"/>
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-black uppercase tracking-wider text-rose-400 mb-0.5">{errorTitle || 'Authentication Notice'}</div>
                      <span className="text-white text-xs leading-relaxed font-semibold">{String(error)}</span>
                    </div>
                  </motion.div>)}
              </AnimatePresence>

              {/* Success Alert */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-xs text-emerald-200 font-bold flex items-center gap-3 shadow-xl shadow-emerald-950/50 backdrop-blur-md"
                  >
                    <div className="p-1.5 bg-emerald-500/25 border border-emerald-500/50 rounded-lg text-emerald-300 shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-0.5">Authentication Verified</div>
                      <span className="text-white text-xs leading-relaxed font-bold">{success}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User ID / Email Field */}
              <div>
                <label htmlFor="login-identifier" className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  {t('login.userIdOrEmail')} <span className="text-rose-500">*</span>
                </label>
                <div className="group relative">
                  <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none z-10">
                    <UserIcon className={`h-5 w-5 transition-colors duration-200 ${
                      isDark
                        ? 'text-slate-400 group-hover:text-slate-300 group-focus-within:text-indigo-400'
                        : 'text-slate-500 group-hover:text-slate-700 group-focus-within:text-indigo-600'
                    }`}/>
                  </div>
                  <input
                    id="login-identifier"
                    name="vms_user_identity"
                    type="text"
                    data-invalid={Boolean(errors.identifier)}
                    aria-invalid={Boolean(errors.identifier)}
                    className={`login-field-input w-full border rounded-xl pl-12 pr-4 py-3.5 text-sm shadow-inner focus:outline-none transition-all duration-200 ${
                      isDark
                        ? 'bg-[#080e1c] text-slate-100 placeholder-slate-500 border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:bg-[#0c1428] focus:ring-4 focus:ring-indigo-500/20'
                        : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/20'
                    } ${errors.identifier ? '!border-rose-500 !bg-rose-950/20 !text-rose-600 focus:!ring-rose-500/20' : ''}`}
                    value={values.identifier}
                    onChange={(e) => handleChange('identifier', e.target.value)}
                    onBlur={() => handleBlur('identifier')}
                    placeholder={t('login.enterUserId')}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
                <FieldError error={errors.identifier} id="login-identifier-error"/>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  {t('login.password')} <span className="text-rose-500">*</span>
                </label>
                <div className="group relative">
                  <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none z-10">
                    <Lock className={`h-5 w-5 transition-colors duration-200 ${
                      isDark
                        ? 'text-slate-400 group-hover:text-slate-300 group-focus-within:text-indigo-400'
                        : 'text-slate-500 group-hover:text-slate-700 group-focus-within:text-indigo-600'
                    }`}/>
                  </div>
                  <input
                    id="login-password"
                    name="vms_user_password"
                    type={showPassword ? 'text' : 'password'}
                    data-invalid={Boolean(errors.password)}
                    aria-invalid={Boolean(errors.password)}
                    className={`login-field-input w-full border rounded-xl pl-12 pr-12 py-3.5 text-sm shadow-inner focus:outline-none transition-all duration-200 ${
                      isDark
                        ? 'bg-[#080e1c] text-slate-100 placeholder-slate-500 border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:bg-[#0c1428] focus:ring-4 focus:ring-indigo-500/20'
                        : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/20'
                    } ${errors.password ? '!border-rose-500 !bg-rose-950/20 !text-rose-600 focus:!ring-rose-500/20' : ''}`}
                    value={values.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    placeholder={t('login.enterPassword')}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                  <div className="absolute right-4 inset-y-0 flex items-center z-10">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`flex items-center justify-center transition-colors duration-200 p-1 rounded-lg ${
                        isDark
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (<Eye className="h-5 w-5"/>) : (<EyeOff className="h-5 w-5"/>)}
                    </button>
                  </div>
                </div>
                {capsLockOn && (<p className="mt-1.5 text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                    <span>⇪</span> {t('login.capsLockOn')}
                  </p>)}
                <FieldError error={errors.password} id="login-password-error"/>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2 cursor-pointer text-xs select-none transition-colors ${
                  isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900 font-medium'
                }`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`rounded h-4 w-4 transition-colors cursor-pointer text-indigo-600 focus:ring-indigo-500 ${
                      isDark ? 'bg-[#080e1c] border-slate-600' : 'bg-white border-slate-300'
                    }`}
                  />
                  {t('login.rememberMe')}
                </label>
                <Link
                  to="/forgot-password"
                  state={{ identifier: values.identifier }}
                  className={`text-xs font-bold transition-colors ${
                    isDark ? 'text-indigo-400 hover:text-indigo-300 hover:underline' : 'text-indigo-600 hover:text-indigo-800 hover:underline'
                  }`}
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              {/* Sign In Button with Tactile Interaction */}
              <button
                type="submit"
                disabled={loading || isSubmitting}
                id="login-submit-btn"
                style={{ backgroundColor: 'var(--accent-purple, #6366f1)' }}
                className="w-full h-12 min-h-[48px] text-white text-sm font-extrabold tracking-wide px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {loading || isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span>{t('login.signInBtn')}</span>
                  </>
                )}
              </button>

              {/* Don't have an account? Sign Up */}
              <div className="text-center pt-3">
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  {t('login.noAccount')}{' '}
                </span>
                <Link
                  to="/signup"
                  className={`text-xs font-extrabold hover:underline transition-colors ${
                    isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  {t('login.signUp')}
                </Link>
              </div>
            </form>

            {/* Contact Footer */}
            <div className={`mt-7 pt-5 border-t ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
              <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] ${
                isDark ? 'text-slate-300' : 'text-slate-600 font-medium'
              }`}>
                <span>{t('login.needHelp')}</span>
                {orgPhone && (<a href={`tel:${orgPhone}`} className={`flex items-center gap-1 hover:scale-105 transition-all ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-600 hover:text-sky-800 font-bold'
                }`}>
                    <Phone className={`h-3 w-3 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`}/>
                    {orgPhone}
                  </a>)}
                {orgEmail && (<>
                    <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
                    <a href={`mailto:${orgEmail}`} className={`flex items-center gap-1 hover:scale-105 transition-all ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-600 hover:text-sky-800 font-bold'
                    }`}>
                      <Mail className={`h-3 w-3 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`}/>
                      {orgEmail}
                    </a>
                  </>)}
                {orgWebsite && (<>
                    <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
                    <a href={orgWebsite.startsWith('http') ? orgWebsite : `https://${orgWebsite}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 hover:scale-105 transition-all ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-600 hover:text-sky-800 font-bold'
                    }`}>
                      <Globe className={`h-3 w-3 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`}/>
                      {t('login.website')}
                    </a>
                  </>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
