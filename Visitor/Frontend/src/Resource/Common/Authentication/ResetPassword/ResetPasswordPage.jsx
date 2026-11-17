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
    return (<div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans relative overflow-hidden">
      {/* Background Orbs & Ambient Radial Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(99,102,241,0.18),transparent_65%),radial-gradient(ellipse_60%_60%_at_80%_90%,rgba(168,85,247,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none"/>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none"/>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"/>

      <div className="flex flex-col min-h-screen w-full relative z-10">
        {/* Top Navbar */}
        <header className="px-4 py-4 sm:px-6 lg:px-12 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-xl bg-[#070b14]/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: 'var(--accent-purple)' }}>
              <Shield className="h-5 w-5 text-white"/>
            </div>
            <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
              Visitor Management System
            </span>
          </div>

          <Link to="/login" className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4"/>
            Back to Sign In
          </Link>
        </header>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-[480px] relative">
            {/* Ambient Back Glow for Elevation */}
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-blue-500/20 blur-xl opacity-75 pointer-events-none" />

            <div className="relative bg-gradient-to-b from-[#141d33] via-[#0f172a] to-[#0a1020] border border-slate-700/80 rounded-3xl p-6 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/40">
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent rounded-full"/>

              {success ? (<div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400"/>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Password Updated!</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                  <button onClick={() => navigate('/login')} style={{ backgroundColor: 'var(--accent-purple, #6366f1)' }} className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-lg mt-4 cursor-pointer">
                    Proceed to Sign In
                  </button>
                </div>) : (<>
                  <div className="flex justify-center mb-4">
                    <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/15 shadow-inner">
                      <KeyRound className="h-7 w-7 text-indigo-400"/>
                    </div>
                  </div>

                  <h2 className="text-2xl font-extrabold text-white text-center">
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-300 text-center mt-1 mb-6 font-medium">
                    Enter your email, verification token, and your new password
                  </p>

                  {error && (<div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-semibold flex items-center gap-2">
                      <span className="shrink-0 text-red-400 font-bold">!</span>
                      <span>{error}</span>
                    </div>)}

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
                    {/* Email */}
                    <div>
                      <label htmlFor="reset-email" className="block text-[11px] font-bold text-slate-300 mb-2">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        data-invalid={Boolean(errors.email)}
                        aria-invalid={Boolean(errors.email)}
                        className={`w-full bg-[#080e1c] border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:outline-none transition-all duration-200 ${errors.email
                          ? 'border-rose-500 bg-rose-950/25 text-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                          : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:bg-[#0c1428] focus:ring-4 focus:ring-indigo-500/20'}`}
                        value={values.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="Enter email address"
                      />
                      <FieldError error={errors.email} id="reset-email-error"/>
                    </div>

                    {/* Token */}
                    <div>
                      <label htmlFor="reset-token" className="block text-[11px] font-bold text-slate-300 mb-2">
                        Verification Token <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="reset-token"
                        name="token"
                        type="text"
                        data-invalid={Boolean(errors.token)}
                        aria-invalid={Boolean(errors.token)}
                        className={`w-full bg-[#080e1c] border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:outline-none transition-all duration-200 text-center tracking-widest ${errors.token
                          ? 'border-rose-500 bg-rose-950/25 text-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                          : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:bg-[#0c1428] focus:ring-4 focus:ring-indigo-500/20'}`}
                        value={values.token}
                        onChange={(e) => handleChange('token', e.target.value)}
                        onBlur={() => handleBlur('token')}
                        placeholder="Paste code from email"
                      />
                      <FieldError error={errors.token} id="reset-token-error"/>
                    </div>

                    {/* New Password */}
                    <div>
                      <label htmlFor="reset-newPassword" className="block text-[11px] font-bold text-slate-300 mb-2">
                        New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <input
                          id="reset-newPassword"
                          name="newPassword"
                          type={showNewPw ? 'text' : 'password'}
                          data-invalid={Boolean(errors.newPassword)}
                          aria-invalid={Boolean(errors.newPassword)}
                          className={`w-full bg-[#080e1c] border rounded-xl pl-4 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:outline-none transition-all duration-200 ${errors.newPassword
                            ? 'border-rose-500 bg-rose-950/25 text-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                            : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:bg-[#0c1428] focus:ring-4 focus:ring-indigo-500/20'}`}
                          value={values.newPassword}
                          onChange={(e) => handleChange('newPassword', e.target.value)}
                          onBlur={() => handleBlur('newPassword')}
                          placeholder="Minimum 8 characters"
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
                          {showNewPw ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
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
                      <div className="relative group">
                        <input
                          id="reset-confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPw ? 'text' : 'password'}
                          data-invalid={Boolean(errors.confirmPassword)}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          className={`w-full bg-[#080e1c] border rounded-xl pl-4 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:outline-none transition-all duration-200 ${errors.confirmPassword
                            ? 'border-rose-500 bg-rose-950/25 text-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                            : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:bg-[#0c1428] focus:ring-4 focus:ring-indigo-500/20'}`}
                          value={values.confirmPassword}
                          onChange={(e) => handleChange('confirmPassword', e.target.value)}
                          onBlur={() => handleBlur('confirmPassword')}
                          placeholder="Re-enter new password"
                        />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
                          {showConfirmPw ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                        </button>
                      </div>
                      <FieldError error={errors.confirmPassword} id="reset-confirmPassword-error"/>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || isSubmitting}
                      style={{ backgroundColor: 'var(--accent-purple, #6366f1)' }}
                      className="w-full text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6"
                    >
                      {loading || isSubmitting ? (<span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                          <Lock className="h-4 w-4"/>
                          Update Password
                        </>)}
                    </button>

                    <div className="text-center pt-4 border-t border-slate-700/60 mt-4">
                      <Link to="/login" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 hover:underline transition-colors">
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
