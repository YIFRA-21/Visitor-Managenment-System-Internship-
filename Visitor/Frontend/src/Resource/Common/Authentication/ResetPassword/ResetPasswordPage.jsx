import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, Shield, Phone, Mail, KeyRound, } from 'lucide-react';
import { authApi } from '../../../../services/api';
import { useEnterpriseForm } from '../../../../hooks/useEnterpriseForm';
import { ValidationRules } from '../../../../services/validationService';
import FieldError from '../../../../components/common/FieldError';
import PasswordStrengthMeter from '../../../../components/common/PasswordStrengthMeter';
export default function ResetPasswordPage() {
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { values, errors, handleChange, handleBlur, handleSubmit, setFieldValue, setBackendErrors, isSubmitting, } = useEnterpriseForm({
        initialValues: {
            email: localStorage.getItem('demoResetEmail') || '',
            token: localStorage.getItem('demoResetToken') || '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: {
            email: (val) => ValidationRules.required(val, 'Email') || ValidationRules.email(val),
            token: (val) => ValidationRules.required(val, 'Verification Token'),
            newPassword: (val) => ValidationRules.required(val, 'New Password') || ValidationRules.password(val),
            confirmPassword: (val, allVals) => ValidationRules.required(val, 'Confirm Password') || ValidationRules.confirmPassword(val, allVals.newPassword),
        },
        onSubmit: async (formValues) => {
            setError('');
            setLoading(true);
            try {
                await authApi.resetPassword(formValues.email.trim(), formValues.token.trim(), formValues.newPassword);
                localStorage.removeItem('demoResetToken');
                localStorage.removeItem('demoResetEmail');
                setSuccess(true);
            }
            catch (err) {
                const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please check your token.';
                setError(msg);
                setBackendErrors(err);
            }
            finally {
                setLoading(false);
            }
        },
    });
    useEffect(() => {
        const cachedToken = localStorage.getItem('demoResetToken');
        const cachedEmail = localStorage.getItem('demoResetEmail');
        if (cachedToken)
            setFieldValue('token', cachedToken);
        if (cachedEmail)
            setFieldValue('email', cachedEmail);
    }, [setFieldValue]);
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

          <Link to="/login" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4"/>
            Back to Sign In
          </Link>
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
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                  <button onClick={() => navigate('/login')} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg mt-4">
                    Proceed to Sign In
                  </button>
                </div>) : (<>
                  <div className="flex justify-center mb-4">
                    <div className="p-3.5 rounded-2xl border border-slate-800" style={{ backgroundColor: 'rgba(127, 119, 221, 0.1)' }}>
                      <KeyRound className="h-7 w-7" style={{ color: 'var(--accent-purple)' }}/>
                    </div>
                  </div>

                  <h2 className="text-xl font-extrabold text-white text-center">
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-400 text-center mt-1 mb-6">
                    Enter your email, verification token, and your new password
                  </p>

                  {error && (<div className="mb-4 rounded-lg border border-red-500/20 bg-red-950/25 p-3 text-xs text-red-400 font-semibold">
                      {error}
                    </div>)}

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
                    {/* Email */}
                    <div>
                      <label htmlFor="reset-email" className="block text-[11px] font-bold text-slate-300 mb-2">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input id="reset-email" name="email" type="email" data-invalid={Boolean(errors.email)} aria-invalid={Boolean(errors.email)} className={`w-full bg-[#05080e] border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${errors.email
                ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.email} onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} placeholder="Enter email address"/>
                      <FieldError error={errors.email} id="reset-email-error"/>
                    </div>

                    {/* Token */}
                    <div>
                      <label htmlFor="reset-token" className="block text-[11px] font-bold text-slate-300 mb-2">
                        Verification Token <span className="text-rose-500">*</span>
                      </label>
                      <input id="reset-token" name="token" type="text" data-invalid={Boolean(errors.token)} aria-invalid={Boolean(errors.token)} className={`w-full bg-[#05080e] border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-center tracking-widest ${errors.token
                ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.token} onChange={(e) => handleChange('token', e.target.value)} onBlur={() => handleBlur('token')} placeholder="Paste code from email"/>
                      <FieldError error={errors.token} id="reset-token-error"/>
                    </div>

                    {/* New Password */}
                    <div>
                      <label htmlFor="reset-newPassword" className="block text-[11px] font-bold text-slate-300 mb-2">
                        New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input id="reset-newPassword" name="newPassword" type={showNewPw ? 'text' : 'password'} data-invalid={Boolean(errors.newPassword)} aria-invalid={Boolean(errors.newPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${errors.newPassword
                ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)} onBlur={() => handleBlur('newPassword')} placeholder="Minimum 8 characters"/>
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showNewPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                      <FieldError error={errors.newPassword} id="reset-newPassword-error"/>
                      {values.newPassword && (<PasswordStrengthMeter password={values.newPassword}/>)}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="reset-confirmPassword" className="block text-[11px] font-bold text-slate-300 mb-2">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input id="reset-confirmPassword" name="confirmPassword" type={showConfirmPw ? 'text' : 'password'} data-invalid={Boolean(errors.confirmPassword)} aria-invalid={Boolean(errors.confirmPassword)} className={`w-full bg-[#05080e] border rounded-lg pl-4 pr-11 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${errors.confirmPassword
                ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD]/20'}`} value={values.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} onBlur={() => handleBlur('confirmPassword')} placeholder="Re-enter new password"/>
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showConfirmPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                      <FieldError error={errors.confirmPassword} id="reset-confirmPassword-error"/>
                    </div>

                    <button type="submit" disabled={loading || isSubmitting} style={{ backgroundColor: 'var(--accent-purple)' }} className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-[0_0_15px_rgba(127,119,221,0.15)] mt-6">
                      {loading || isSubmitting ? (<span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                          <Lock className="h-4 w-4"/>
                          Update Password
                        </>)}
                    </button>

                    <div className="text-center pt-4 border-t border-slate-800/60 mt-4">
                      <Link to="/login" style={{ color: 'var(--accent-purple)' }} className="text-xs font-bold flex items-center justify-center gap-1.5 hover:underline">
                        <ArrowLeft className="h-4 w-4"/> Cancel reset
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
              Your security is our priority. All reset links and codes expire in 15 minutes.
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
