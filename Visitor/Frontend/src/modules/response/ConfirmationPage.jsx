/**
 * Enterprise Visitor Management System (VMS)
 * Global Centralized Confirmation Page Component
 * Dedicated React Router page for consequential actions across all modules and roles.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleLanding } from '../../config/routes';
import { RESPONSE_TYPES } from './responseConfig';
import { normalizeApiError } from './errorNormalizationService';
import { sanitizeReturnUrl } from './useResponseNavigation';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const state = location.state || {};
  const userRole = user?.role || 'visitor';
  const roleDashboard = getRoleLanding(userRole, user) || '/dashboard';
  const returnUrl = sanitizeReturnUrl(state.returnUrl, roleDashboard);

  // If page was loaded directly without state
  if (!state.title && !searchParams.get('title')) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0b101b] border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl">
          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Confirmation Pending</h2>
          <p className="text-xs text-slate-400 mb-6">
            There is currently no consequential action awaiting authorization. Please return to your workspace.
          </p>
          <button
            onClick={() => navigate(roleDashboard)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const title = state.title || searchParams.get('title') || 'Confirm Consequential Operation';
  const message = state.message || searchParams.get('message') || 'Are you sure you want to proceed with this operation?';
  const entityType = state.entityType || searchParams.get('type') || 'Record';
  const entityName = state.entityName || searchParams.get('name') || '';
  const consequences = Array.isArray(state.consequences) && state.consequences.length > 0
    ? state.consequences
    : [
        'This action modifies permanent corporate records and security states.',
        'Dependent processes, notifications, and scheduled tasks may be altered.',
        'This transaction will be recorded in the enterprise audit trail with your identity token.'
      ];

  const confirmLabel = state.confirmLabel || 'Yes, Confirm & Execute';
  const cancelLabel = state.cancelLabel || 'Cancel & Go Back';
  const confirmVariant = state.confirmVariant || 'danger'; // 'danger' | 'warning' | 'primary' | 'success'

  const apiEndpoint = state.apiEndpoint;
  const apiMethod = (state.apiMethod || 'DELETE').toUpperCase();
  const apiPayload = state.apiPayload || {};
  const successConfig = state.successConfig || {};

  const handleCancel = () => {
    navigate(returnUrl, { replace: true });
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorNotice(null);

    // If an API endpoint is provided, execute real authorized request
    if (apiEndpoint) {
      try {
        let response;
        if (apiMethod === 'DELETE') {
          response = await apiClient.delete(apiEndpoint, { data: apiPayload });
        } else if (apiMethod === 'POST') {
          response = await apiClient.post(apiEndpoint, apiPayload);
        } else if (apiMethod === 'PUT') {
          response = await apiClient.put(apiEndpoint, apiPayload);
        } else if (apiMethod === 'PATCH') {
          response = await apiClient.patch(apiEndpoint, apiPayload);
        } else {
          response = await apiClient.get(apiEndpoint);
        }

        // Navigate to dedicated success response page
        navigate('/response', {
          replace: true,
          state: {
            type: successConfig.type || RESPONSE_TYPES.SUCCESS,
            title: successConfig.title || 'Operation Completed Successfully',
            message: successConfig.message || response?.data?.message || `The ${entityType.toLowerCase()} operation was committed successfully.`,
            referenceId: response?.data?.referenceId || response?.data?.id || state.entityId || null,
            entityType,
            entityName,
            returnUrl,
            confirmText: 'Confirm',
            primaryActionUrl: returnUrl,
            timestamp: new Date().toLocaleString(),
          },
        });
      } catch (err) {
        setIsSubmitting(false);
        const normalized = normalizeApiError(err, { title: 'Operation Failed' });
        
        // Navigate to dedicated error response page
        navigate('/response', {
          replace: true,
          state: {
            type: normalized.type || RESPONSE_TYPES.ERROR,
            title: normalized.title || 'Operation Execution Failed',
            message: normalized.message,
            details: normalized.details,
            validationErrors: normalized.validationErrors,
            statusCode: normalized.statusCode,
            errorCode: normalized.errorCode,
            entityType,
            entityName,
            returnUrl,
            retryUrl: location.pathname,
            primaryActionText: 'Retry Confirmation',
            primaryActionUrl: returnUrl,
            secondaryActionText: 'Return to Dashboard',
            secondaryActionUrl: roleDashboard,
            timestamp: new Date().toLocaleString(),
          },
        });
      }
    } else {
      // Direct navigation callback confirmation without explicit endpoint
      navigate('/response', {
        replace: true,
        state: {
          type: successConfig.type || RESPONSE_TYPES.SUCCESS,
          title: successConfig.title || 'Action Confirmed',
          message: successConfig.message || `The operation on ${entityName || entityType} has been processed.`,
          returnUrl,
          confirmText: 'Confirm',
          primaryActionUrl: returnUrl,
          timestamp: new Date().toLocaleString(),
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-[-25%] left-[-15%] h-[600px] w-[600px] rounded-full bg-rose-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] h-[600px] w-[600px] rounded-full bg-amber-950/15 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-white">VMS ACTION AUTHORIZATION</span>
            <p className="text-[10px] text-slate-400">Security Gate & Consequential Impact Review</p>
          </div>
        </div>

        {/* Theme Toggle & Ethiopia Accent Ribbon */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500" />
            <span className="w-2.5 h-1.5 rounded-sm bg-amber-400" />
            <span className="w-2.5 h-1.5 rounded-sm bg-rose-500" />
          </div>
        </div>
      </header>

      {/* Main Confirmation Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl bg-[#0b101b]/95 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Top Warning Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />

          {/* Badge & Notice */}
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              CONFIRMATION REQUIRED
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ROLE: {String(userRole).toUpperCase()}
            </span>
          </div>

          {/* Title & Target Record */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Target Entity Spotlight Box */}
          {(entityName || entityType) && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Target {entityType}
                </span>
                <span className="text-sm sm:text-base font-bold text-white truncate block">
                  {entityName || 'Selected Item'}
                </span>
              </div>
            </div>
          )}

          {/* Consequence Impact List */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-950/15 border border-amber-500/25">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Impacts & Consequences:
            </h4>
            <ul className="space-y-2 text-xs text-amber-200/90">
              {consequences.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="leading-snug">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>{cancelLabel}</span>
            </button>

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                confirmVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Authorization...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/60 bg-[#090e1a]/60 text-center text-[11px] text-slate-500">
        Enterprise Visitor Management System • Cryptographic Authorization Gate
      </footer>
    </div>
  );
}
