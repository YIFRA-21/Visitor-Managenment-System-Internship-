import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, Shield, Phone, Mail, KeyRound, LogOut, } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useEnterpriseForm } from '../../../../hooks/useEnterpriseForm';
import { ValidationRules } from '../../../../services/validationService';
import FieldError from '../../../../components/common/FieldError';
import PasswordStrengthMeter from '../../../../components/common/PasswordStrengthMeter';
import ThemeToggle from '../../../../components/ThemeToggle/ThemeToggle';
import { getRoleLanding, ROUTES } from '../../../../config/routes';
export default function ChangePasswordPage() {
    const { user, token, completePasswordChange, logout } = useAuth();
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const isFirstLogin = Boolean(user?.firstLoginRequired || user?.passwordChangeRequired);
    const { values, errors, handleChange, handleBlur, handleSubmit, setBackendErrors, isSubmitting, } = useEnterpriseForm({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: {
            currentPassword: (val) => {
                if (isFirstLogin)
                    return null;
                return ValidationRules.required(val, 'Current Password') || null;
            },
            newPassword: (val) => ValidationRules.required(val, 'New Password') || ValidationRules.password(val),
            confirmPassword: (val, allVals) => ValidationRules.required(val, 'Confirm Password') ||
                ValidationRules.confirmPassword(val, allVals.newPassword),
        },
        onSubmit: async (formValues) => {
            setError('');
            setLoading(true);
            try {
                const passToSubmit = formValues.currentPassword || 'TEMP_BYPASS';
                await completePasswordChange(passToSubmit, formValues.newPassword);
                setSuccess(true);
                // Auto-redirect directly to role portal (Employee Portal for EMP accounts)
                setTimeout(() => {
                    const target = user ? getRoleLanding(user.role, user) : ROUTES.PUBLIC.LOGIN;
                    navigate(target, { replace: true });
                }, 1200);
            }
            catch (err) {
                const msg = err.response?.data?.message ||
                    err.response?.data?.error ||
                    err.message ||
                    'Failed to change password. Please try again.';
                setError(msg);
                setBackendErrors(err);
            }
            finally {
                setLoading(false);
            }
        },
    });
    const handleLogout = () => {
        logout();
        navigate(ROUTES.PUBLIC.LOGIN);
    };
    if (!token) {
        return <Navigate to={ROUTES.PUBLIC.LOGIN} replace/>;
    }
    return (<div className="flex min-h-screen bg-[#070b13] text-slate-100 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none"/>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none"/>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"/>

      <div className="flex flex-col min-h-screen w-full relative z-10">
        {/* Top Navbar */}
        <header className="px-4 py-4 sm:px-6 lg:px-12 flex items-center justify-between border-b border-slate-800/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: 'var(--accent-purple)' }}>
              <Shield className="h-5 w-5 text-white"/>
            </div>
            <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
              Visitor Management System
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer">
              <LogOut className="h-4 w-4"/>
              Sign Out
            </button>
          </div>
        </header>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-[460px]">
            <div className="bg-[#0b101b]/95 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400"/>

              {success ? (<div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400"/>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Password Updated!</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Your password has been changed successfully. Redirecting to your portal...
                  </p>
                  <button onClick={() => {
                const target = user ? getRoleLanding(user.role, user) : ROUTES.PUBLIC.LOGIN;
                navigate(target, { replace: true });
            }} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg mt-4">
                    Continue to Portal
                  </button>
                </div>) : (<>
                  <div className="flex justify-center mb-4">
                    <div className="p-3.5 rounded-2xl border border-slate-800" style={{ backgroundColor: 'rgba(127, 119, 221, 0.1)' }}>
                      <KeyRound className="h-7 w-7" style={{ color: 'var(--accent-purple)' }}/>
                    </div>
                  </div>

                  <h2 className="text-xl font-extrabold text-white text-center">
                    Change Your Password
                  </h2>
                  <p className="text-xs text-slate-400 text-center mt-1 mb-4">
                    {isFirstLogin
                ? 'Set your new secure password to access the VMS.'
                : 'Update your account password.'}
                  </p>

                  {error && (<div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                      <span className="shrink-0 text-rose-400 font-bold">!</span>
                      <span>{error}</span>
                    </div>)}

                  <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    {/* Current Password — Only shown for non-first-login requests */}
                    {!isFirstLogin && (<div>
                        <label htmlFor="cp-current" className="block text-[11px] font-bold text-slate-300 mb-2">
                          Current Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input id="cp-current" name="currentPassword" type={showCurrentPw ? 'text' : 'password'} data-invalid={Boolean(errors.currentPassword)} aria-invalid={Boolean(errors.currentPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${errors.currentPassword
                    ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.currentPassword} onChange={(e) => handleChange('currentPassword', e.target.value)} onBlur={() => handleBlur('currentPassword')} placeholder="Enter your current password" autoComplete="current-password"/>
                          <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showCurrentPw ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                          </button>
                        </div>
                        <FieldError error={errors.currentPassword} id="cp-current-error"/>
                      </div>)}

                    {/* New Password */}
                    <div>
                      <label htmlFor="cp-new" className="block text-[11px] font-bold text-slate-300 mb-2">
                        New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input id="cp-new" name="newPassword" type={showNewPw ? 'text' : 'password'} data-invalid={Boolean(errors.newPassword)} aria-invalid={Boolean(errors.newPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${errors.newPassword
                ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)} onBlur={() => handleBlur('newPassword')} placeholder="Minimum 8 characters" autoComplete="new-password"/>
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showNewPw ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                        </button>
                      </div>
                      <FieldError error={errors.newPassword} id="cp-new-error"/>
                      {values.newPassword && (<PasswordStrengthMeter password={values.newPassword}/>)}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="cp-confirm" className="block text-[11px] font-bold text-slate-300 mb-2">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input id="cp-confirm" name="confirmPassword" type={showConfirmPw ? 'text' : 'password'} data-invalid={Boolean(errors.confirmPassword)} aria-invalid={Boolean(errors.confirmPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${errors.confirmPassword
                ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} onBlur={() => handleBlur('confirmPassword')} placeholder="Re-enter new password" autoComplete="new-password"/>
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showConfirmPw ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                        </button>
                      </div>
                      <FieldError error={errors.confirmPassword} id="cp-confirm-error"/>
                    </div>

                    <button type="submit" disabled={loading || isSubmitting} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-[0_0_15px_rgba(127,119,221,0.15)] mt-6">
                      {loading || isSubmitting ? (<span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                          <Lock className="h-4 w-4"/>
                          Update Password
                        </>)}
                    </button>

                    <div className="text-center pt-4 border-t border-slate-800/60 mt-4">
                      <Link to={ROUTES.PUBLIC.LOGIN} style={{ color: 'var(--accent-purple)' }} className="text-xs font-bold hover:underline">
                        Sign in with a different account
                      </Link>
                    </div>
                  </form>
                </>)}
            </div>
          </motion.div>
        </div>

        {/* Bottom footer */}
        <div className="px-6 py-4 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
            <p className="flex items-center gap-1">
              <Shield className="h-3 w-3"/>
              Your security is our priority. Temporary passwords expire after 24 hours.
            </p>
            <div className="flex items-center gap-3">
              <span>Need help?</span>
              <a href="tel:+251111234567" className="flex items-center gap-1 hover:text-slate-400 transition-colors">
                <Phone className="h-3 w-3"/> +251 11 123 4567
              </a>
              <span className="text-slate-700">|</span>
              <a href="mailto:support@vms.com" className="flex items-center gap-1 hover:text-slate-400 transition-colors">
                <Mail className="h-3 w-3"/> support@vms.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
