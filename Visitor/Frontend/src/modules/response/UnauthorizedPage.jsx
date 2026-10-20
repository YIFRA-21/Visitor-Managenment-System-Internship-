/**
 * Enterprise Visitor Management System (VMS)
 * Centralized Unauthorized / Access Denied Page
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldBan, ArrowLeft, LayoutDashboard, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleLanding } from '../../config/routes';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role || 'visitor';
  const roleDashboard = getRoleLanding(userRole, user) || '/dashboard';
  const state = location.state || {};
  const message = state.message || 'Your user account or role clearance does not possess sufficient privileges to view or perform operations on this resource.';

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      <div className="absolute top-[-25%] left-[-15%] h-[600px] w-[600px] rounded-full bg-red-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] h-[600px] w-[600px] rounded-full bg-purple-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-white">VMS ACCESS CONTROL</span>
            <p className="text-[10px] text-slate-400">Enterprise Role-Based Access Enforcement</p>
          </div>
        </div>

        {/* Ethiopia Accent Ribbon */}
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500" />
          <span className="w-2.5 h-1.5 rounded-sm bg-amber-400" />
          <span className="w-2.5 h-1.5 rounded-sm bg-rose-500" />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-[#0b101b]/95 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-purple-600" />

          <div className="w-20 h-20 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
            <ShieldBan className="w-10 h-10 text-rose-400" />
          </div>

          <h1 className="text-3xl font-black text-white tracking-wider mb-2">403</h1>
          <h2 className="text-lg font-bold text-slate-200 mb-3">Access Clearance Denied</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
            {!user ? (
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Authorized Account</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-400" />
                  <span>Go Back</span>
                </button>

                <button
                  onClick={() => navigate(roleDashboard)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Return to Authorized Dashboard</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/60 bg-[#090e1a]/60 text-center text-[11px] text-slate-500">
        Enterprise Visitor Management System • Security Clearance Audit ID Logged
      </footer>
    </div>
  );
}
