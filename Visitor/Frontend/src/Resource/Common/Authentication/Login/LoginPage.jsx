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

                let errorMsg = '';
                if (isBlockedErr) {
                    errorMsg = 'This user is blocked. Please call the administrator.';
                } else if (err.response?.status === 403) {
                    errorMsg = rawMsg || 'Access Denied: Account is restricted. Please contact administrator.';
                } else if (err.response?.status === 429 || err.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
                    errorMsg = t('login.rateLimited');
                } else if (rawMsg) {
                    errorMsg = rawMsg;
                } else {
                    errorMsg = t('login.invalidCredentials');
                }

                const finalError = typeof errorMsg === 'string' ? errorMsg : 'This user is blocked. Please call the administrator.';
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
    return (<div className="flex min-h-screen bg-[#070b13] text-slate-100 font-sans relative overflow-hidden">
      {/* ═══════════════════════════════════════════════════
            LEFT BRANDING PANEL
           ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden dark-panel">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/vms-lobby.png" alt="Enterprise VMS Lobby" className="w-full h-full object-cover object-center scale-[1.02] filter contrast-[1.05] brightness-[0.85]"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/90 via-[#070b13]/60 to-[#070b13]/90"/>
        </div>

        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white rounded-xl shadow-md border border-slate-200">
              <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="w-9 h-9 object-contain rounded-lg" onError={(e) => {
            e.target.src = '/logo.png';
        }}/>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
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
            <div className="relative rounded-3xl bg-slate-950/75 backdrop-blur-2xl border border-white/15 p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/10 space-y-5">
              
              {/* Top Security Status Pill */}
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="uppercase text-[10px] tracking-wider font-extrabold text-emerald-300">
                    Live Security Shield
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300">ISO 27001 Verified</span>
                </div>
              </div>

              {/* Card Title with Vibrant Text Gradient */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.2] text-white">
                <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-md">
                  {t('login.secureVisitorMgmt')}
                </span>
              </h1>

              {/* Card Subtitle / Description */}
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {t('login.enterpriseDesc')}
              </p>

              {/* Feature Chips / Verification Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t('login.encrypted')}</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-medium hover:bg-sky-500/20 transition-colors">
                  <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{t('login.compliant')}</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-colors">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Zero-Trust Verification</span>
                </div>
              </div>

            </div>
          </motion.div>
        </div>

        <div className="relative z-10 p-12 pt-0 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-500">v2.4.0 • Enterprise Security Grade</span>
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>99.99% Cloud Service Uptime</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
            RIGHT LOGIN FORM PANEL
           ═══════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10 bg-[#070b13] relative">
        {/* Theme Toggle & Language Dropdown Selector */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2.5">
          <ThemeToggle />
          <LanguageDropdown variant="dark"/>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Logo Badge & Heading */}
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="p-2 bg-white rounded-2xl mb-3 shadow-xl border border-slate-200">
                <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="w-14 h-14 object-contain rounded-xl" onError={(e) => {
            e.target.src = '/logo.png';
        }}/>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-wide">
                {t('login.signIn')}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {organization?.shortName
            ? (language === 'am' ? `ወደ ${organization.name} ይግቡ` : `${t('login.signInTo')} ${organization.name}`)
            : t('login.enterCredentials')}
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
                      <div className="text-[11px] font-black uppercase tracking-wider text-rose-400 mb-0.5">Account Status Notice</div>
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
                <label htmlFor="login-identifier" className="block text-[11px] font-bold text-slate-300 mb-2">
                  {t('login.userIdOrEmail')} <span className="text-rose-500">*</span>
                </label>
                <div className="group relative">
                  <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none z-10">
                    <UserIcon className="h-5 w-5 text-slate-500 transition-colors duration-200 group-focus-within:text-[#7F77DD]"/>
                  </div>
                  <input id="login-identifier" name="vms_user_identity" type="text" data-invalid={Boolean(errors.identifier)} aria-invalid={Boolean(errors.identifier)} className={`w-full bg-[#05080e] border rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-200 ${errors.identifier
            ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
            : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.identifier} onChange={(e) => handleChange('identifier', e.target.value)} onBlur={() => handleBlur('identifier')} placeholder={t('login.enterUserId')} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}/>
                </div>
                <FieldError error={errors.identifier} id="login-identifier-error"/>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className="block text-[11px] font-bold text-slate-300 mb-2">
                  {t('login.password')} <span className="text-rose-500">*</span>
                </label>
                <div className="group relative">
                  <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-slate-500 transition-colors duration-200 group-focus-within:text-[#7F77DD]"/>
                  </div>
                  <input id="login-password" name="vms_user_password" type={showPassword ? 'text' : 'password'} data-invalid={Boolean(errors.password)} aria-invalid={Boolean(errors.password)} className={`w-full bg-[#05080e] border rounded-xl pl-12 pr-12 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all duration-200 ${errors.password
            ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
            : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.password} onChange={(e) => handleChange('password', e.target.value)} onBlur={() => handleBlur('password')} onKeyDown={handleKeyDown} onKeyUp={handleKeyDown} placeholder={t('login.enterPassword')} autoComplete="new-password" autoCorrect="off" autoCapitalize="none" spellCheck={false}/>
                  <div className="absolute right-4 inset-y-0 flex items-center z-10">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors duration-200" aria-label={showPassword ? 'Show password' : 'Hide password'}>
                      {showPassword ? (<Eye className="h-5 w-5"/>) : (<EyeOff className="h-5 w-5"/>)}
                    </button>
                  </div>
                </div>
                {capsLockOn && (<p className="mt-1.5 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <span>⇪</span> {t('login.capsLockOn')}
                  </p>)}
                <FieldError error={errors.password} id="login-password-error"/>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors select-none">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded bg-[#05080e] border-slate-700 text-[#7F77DD] focus:ring-[#7F77DD] focus:ring-offset-[#0b101b] h-3.5 w-3.5"/>
                  {t('login.rememberMe')}
                </label>
                <Link to="/forgot-password" state={{ identifier: values.identifier }} style={{ color: 'var(--accent-purple)' }} className="text-xs font-semibold hover:opacity-80 transition-opacity">
                  {t('login.forgotPassword')}
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || isSubmitting}
                id="login-submit-btn"
                style={{ backgroundColor: 'var(--accent-purple)' }}
                className="w-full h-12 min-h-[48px] text-white text-sm font-bold px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(127,119,221,0.2)] hover:shadow-[0_0_30px_rgba(127,119,221,0.35)] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <span className="text-xs text-slate-400">
                  {t('login.noAccount')}{' '}
                </span>
                <Link to="/signup" className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                  {t('login.signUp')}
                </Link>
              </div>
            </form>

            {/* Contact Footer */}
            <div className="mt-7 pt-5 border-t border-slate-800/60">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-400">
                <span>{t('login.needHelp')}</span>
                {orgPhone && (<a href={`tel:${orgPhone}`} className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                    <Phone className="h-3 w-3 text-cyan-400"/>
                    {orgPhone}
                  </a>)}
                {orgEmail && (<>
                    <span className="text-slate-700">|</span>
                    <a href={`mailto:${orgEmail}`} className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                      <Mail className="h-3 w-3 text-cyan-400"/>
                      {orgEmail}
                    </a>
                  </>)}
                {orgWebsite && (<>
                    <span className="text-slate-700">|</span>
                    <a href={orgWebsite.startsWith('http') ? orgWebsite : `https://${orgWebsite}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                      <Globe className="h-3 w-3 text-cyan-400"/>
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
