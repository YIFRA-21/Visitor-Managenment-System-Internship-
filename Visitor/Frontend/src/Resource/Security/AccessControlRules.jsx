import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Building2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Fingerprint,
  Clock,
  Trash2,
  Sparkles,
  Sliders,
  Check,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { securityApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AccessControlRules() {
  const { t, tStatus, language } = useLanguage();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    ruleName: '',
    zoneName: '',
    accessLevel: 'RESTRICTED',
    description: '',
    operationalHours: 'Business Hours (08:00 - 18:00)',
    escortRequired: false,
    biometricsRequired: false
  });
  const [submitting, setSubmitting] = useState(false);

  // Policy Sandbox State
  const [sandboxLevel, setSandboxLevel] = useState('Level 2: General Workspace & Meeting Rooms');
  const [sandboxZone, setSandboxZone] = useState('Floor 5 Executive');
  const [sandboxResult, setSandboxResult] = useState(null);

  const loadRules = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await securityApi.accessRules();
      const data = res.data?.data || res.data || [];
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to synchronize access control rules.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!form.ruleName.trim() || !form.zoneName.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await securityApi.createAccessRule(form);
      setShowModal(false);
      setForm({
        ruleName: '',
        zoneName: '',
        accessLevel: 'RESTRICTED',
        description: '',
        operationalHours: 'Business Hours (08:00 - 18:00)',
        escortRequired: false,
        biometricsRequired: false
      });
      setFeedback({ type: 'success', message: `Rule "${form.ruleName}" created and propagated to perimeter gates.` });
      loadRules(true);
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRule = async (id) => {
    try {
      await securityApi.toggleAccessRule(id);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive, is_active: !r.isActive } : r))
      );
      setFeedback({ type: 'success', message: 'Rule status updated.' });
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const handleDeleteRule = async (id, ruleName) => {
    if (!window.confirm(`Are you sure you want to delete access rule "${ruleName}"?`)) return;

    try {
      await securityApi.deleteAccessRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      setFeedback({ type: 'success', message: `Rule "${ruleName}" removed from security system.` });
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const evaluateSandbox = () => {
    let allowed = true;
    let reason = 'Clearance level matches zone security threshold.';

    if (sandboxZone.includes('Server') || sandboxZone.includes('Basement')) {
      if (!sandboxLevel.includes('Restricted') && !sandboxLevel.includes('VIP') && !sandboxLevel.includes('High Security')) {
        allowed = false;
        reason = 'Zone requires High-Security / Datacenter clearance. Subject level insufficient.';
      }
    } else if (sandboxZone.includes('Executive') || sandboxZone.includes('Floor 5')) {
      if (sandboxLevel.includes('Lobby') || sandboxLevel.includes('Public')) {
        allowed = false;
        reason = 'Zone requires Executive or Escorted clearance. Level 1 Public visitors prohibited.';
      }
    }

    setSandboxResult({ allowed, reason });
  };

  const filteredRules = rules.filter((r) => {
    const level = (r.accessLevel || r.access_level || 'RESTRICTED').toUpperCase();
    if (levelFilter !== 'ALL' && level !== levelFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      const name = (r.ruleName || r.rule_name || '').toLowerCase();
      const zone = (r.zoneName || r.zone_name || '').toLowerCase();
      return name.includes(q) || zone.includes(q);
    }
    return true;
  });

  const totalRules = rules.length;
  const highSecRules = rules.filter((r) => (r.accessLevel || r.access_level || '').includes('HIGH') || (r.description || '').includes('Bio: YES')).length;
  const escortMandated = rules.filter((r) => (r.description || '').includes('Escort: YES') || (r.accessLevel || r.access_level || '').includes('RESTRICTED')).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                </span>
                Facility Access Security Policy Engine • SOC Governed
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የዞንና የበር መዳረሻ ቁጥጥር ደንቦች' : 'Access Control Rules & Zone Policies'}
                <Lock className="w-7 h-7 text-purple-400 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Configure floor clearances, biometric security rules, automated turnstile locking schedules, and escort mandates across building zones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => loadRules(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
              {language === 'am' ? 'አድስ' : 'Sync Rules'}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Create Access Rule
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 4 ANIMATED KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Active Rules</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalRules}</h3>
            <span className="text-[11px] font-bold text-slate-400">Policies</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Configured perimeter zones</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">High-Security Zones</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{highSecRules}</h3>
            <span className="text-[11px] font-bold text-rose-400">Biometric</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Datacenter & Vault portals</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Escort Mandates</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-400">{escortMandated}</h3>
            <span className="text-[11px] font-bold text-slate-400">Supervised</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requires security accompaniment</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Perimeter Defense</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-400">100%</h3>
            <span className="text-[11px] font-bold text-emerald-400">Enforced</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Speed gates & doors synced</p>
        </motion.div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by zone name or policy title..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'PUBLIC', 'RESTRICTED', 'HIGH_SECURITY'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                levelFilter === lvl
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── RULES CARDS GRID ── */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
          Loading security zone rules...
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Rules Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No access control policies match your current search or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRules.map((rule) => {
            const level = (rule.accessLevel || rule.access_level || 'RESTRICTED').toUpperCase();
            const isActive = rule.isActive !== false && rule.is_active !== false && rule.is_active !== 0;

            const badgeStyles = {
              PUBLIC: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
              RESTRICTED: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
              HIGH_SECURITY: 'bg-rose-950/60 text-rose-400 border-rose-500/40'
            };

            return (
              <motion.div
                key={rule.id}
                whileHover={{ y: -3 }}
                className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    level === 'HIGH_SECURITY'
                      ? 'bg-rose-500'
                      : level === 'RESTRICTED'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          badgeStyles[level] || badgeStyles.RESTRICTED
                        }`}
                      >
                        {level.replace('_', ' ')}
                      </span>

                      <button
                        onClick={() => handleDeleteRule(rule.id, rule.ruleName || rule.rule_name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-base leading-snug">
                      {rule.ruleName || rule.rule_name}
                    </h3>
                    <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                      {rule.zoneName || rule.zone_name}
                    </p>
                  </div>

                  {rule.description && (
                    <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-medium">
                      {rule.description}
                    </p>
                  )}
                </div>

                {/* Footer status & toggle */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span className={`font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isActive ? 'Rule Active' : 'Suspended'}
                    </span>
                  </span>

                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-bold text-[11px] transition"
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── RULE EVALUATION SANDBOX ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Security Policy Evaluation Sandbox</h3>
            <p className="text-xs text-slate-400">Test visitor clearance against physical zone barriers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1.5">
              Visitor Clearance Level
            </label>
            <select
              value={sandboxLevel}
              onChange={(e) => {
                setSandboxLevel(e.target.value);
                setSandboxResult(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
            >
              <option value="Level 1: Public & Lobby Access Only">Level 1: Public & Lobby Access Only</option>
              <option value="Level 2: General Workspace & Meeting Rooms">Level 2: General Workspace & Meeting Rooms</option>
              <option value="Level 3: Executive Suite & Boardrooms">Level 3: Executive Suite & Boardrooms</option>
              <option value="Level 4: Restricted / IT & Server Rooms">Level 4: Restricted / IT & Server Rooms</option>
              <option value="Level 5: Escorted Visitor (High Security)">Level 5: Escorted Visitor (High Security)</option>
              <option value="Level 6: VIP All-Access Pass">Level 6: VIP All-Access Pass</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1.5">
              Target Building Zone
            </label>
            <select
              value={sandboxZone}
              onChange={(e) => {
                setSandboxZone(e.target.value);
                setSandboxResult(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
            >
              <option value="Main Lobby & Reception">Main Lobby & Floor 1 Public</option>
              <option value="General Meeting Rooms B">Conference Floor 2 & 3</option>
              <option value="Floor 5 Executive">Floor 5 Executive Wing</option>
              <option value="Basement Server Room">Basement IT Server Room & Datacenter</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={evaluateSandbox}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Evaluate Access Rule
            </button>
          </div>
        </div>

        {sandboxResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
              sandboxResult.allowed
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {sandboxResult.allowed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="font-black text-sm">
                {sandboxResult.allowed ? 'PASSAGE AUTHORIZED' : 'TURNSTILE LOCK ENGAGED (ACCESS DENIED)'}
              </p>
              <p className="text-xs font-normal opacity-90 mt-0.5">{sandboxResult.reason}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── CREATE RULE MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Create Zone Access Rule</h3>
                    <p className="text-xs text-slate-400">Define access criteria for facility doors & barriers</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                    Rule Title / Policy Name
                  </label>
                  <input
                    type="text"
                    value={form.ruleName}
                    onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
                    required
                    placeholder="e.g. Executive Wing Access Restriction"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Zone / Floor Name
                    </label>
                    <input
                      type="text"
                      value={form.zoneName}
                      onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
                      required
                      placeholder="e.g. Floor 4 R&D Labs"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                      Clearance Level Required
                    </label>
                    <select
                      value={form.accessLevel}
                      onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="PUBLIC">PUBLIC (General Access)</option>
                      <option value="RESTRICTED">RESTRICTED (Level 2-4)</option>
                      <option value="HIGH_SECURITY">HIGH_SECURITY (Biometrics / Vault)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                    Operational Hours & Enforcement Window
                  </label>
                  <select
                    value={form.operationalHours}
                    onChange={(e) => setForm({ ...form, operationalHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="24/7 Continuous Enforcement">24/7 Continuous Enforcement</option>
                    <option value="Business Hours (08:00 - 18:00)">Business Hours (08:00 - 18:00)</option>
                    <option value="Night Lockdown (18:00 - 06:00)">Night Lockdown (18:00 - 06:00)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-slate-300 text-xs">Mandatory Escort</span>
                    <input
                      type="checkbox"
                      checked={form.escortRequired}
                      onChange={(e) => setForm({ ...form, escortRequired: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-slate-300 text-xs">Biometric Required</span>
                    <input
                      type="checkbox"
                      checked={form.biometricsRequired}
                      onChange={(e) => setForm({ ...form, biometricsRequired: e.target.checked })}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                    Policy Description & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter security policy notes..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Deploy Access Rule</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
