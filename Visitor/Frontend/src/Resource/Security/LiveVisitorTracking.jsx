import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  RefreshCw,
  LogOut,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  Sparkles,
  X,
  Radio
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { securityApi, checkoutApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LiveVisitorTracking() {
  const { t, tStatus, language } = useLanguage();
  const [occupants, setOccupants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());

  const fetchOccupants = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await securityApi.getLiveOccupants().catch(() => ({ data: { data: [] } }));
      const items = res.data?.data || res.data || [];
      setOccupants(Array.isArray(items) ? items : []);
      setLastSync(new Date());
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to sync live facility occupants.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOccupants();
    const interval = setInterval(() => fetchOccupants(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOccupants]);

  const handleGateCheckout = async (occupant) => {
    setCheckingOutId(occupant.checkin_id || occupant.id);
    setFeedback(null);

    try {
      const code = occupant.badge_number || occupant.visitor_code || String(occupant.visitor_id);
      await checkoutApi.process({
        code,
        checkoutMethod: 'SECURITY_GATE',
        remarks: 'Direct gate checkout via Live Facility Occupants console'
      });

      setFeedback({
        type: 'success',
        message: `${occupant.visitor_name} checked out at gate barrier.`
      });

      // Optimistic removal & reload
      setOccupants((prev) => prev.filter((o) => (o.checkin_id || o.id) !== (occupant.checkin_id || occupant.id)));
      fetchOccupants(true);
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setCheckingOutId(null);
    }
  };

  const filteredOccupants = occupants.filter((o) => {
    if (zoneFilter !== 'ALL') {
      const dep = (o.department_name || '').toLowerCase();
      if (!dep.includes(zoneFilter.toLowerCase())) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (o.visitor_name && o.visitor_name.toLowerCase().includes(q)) ||
        (o.visitor_company && o.visitor_company.toLowerCase().includes(q)) ||
        (o.badge_number && o.badge_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalOccupants = occupants.length;
  const normalStay = occupants.filter((o) => (o.minutes_inside || 0) < 120).length;
  const extendedStay = occupants.filter((o) => (o.minutes_inside || 0) >= 120 && (o.minutes_inside || 0) < 240).length;
  const overstayWarning = occupants.filter((o) => (o.minutes_inside || 0) >= 240).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active Facility Occupancy Stream • Refreshed {lastSync.toLocaleTimeString()}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'በግቢው ውስጥ ያሉ ጎብኚዎች' : 'Live Facility Occupants'}
                <Eye className="w-7 h-7 text-emerald-400 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Real-time inside-building location tracker. Monitor active visitors on-premises, detect visit duration overstays, and execute direct gate checkout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchOccupants(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              {language === 'am' ? 'አድስ' : 'Refresh Telemetry'}
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
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Inside Facility</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalOccupants}</h3>
            <span className="text-[11px] font-bold text-slate-400">Active Heads</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Checked in & on premises</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Normal Stay (&lt; 2h)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{normalStay}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Normal</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Within standard schedule</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Extended Stay (2-4h)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-400">{extendedStay}</h3>
            <span className="text-[11px] font-bold text-slate-400">Monitored</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Approaching standard limit</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-rose-900/40 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Overstay Alert (&gt; 4h)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{overstayWarning}</h3>
            <span className="text-[11px] font-bold text-rose-400">Overdue</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Security check required</p>
        </motion.div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search occupants by name, company, or badge number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'Lobby', 'Engineering', 'Executive', 'Datacenter'].map((zone) => (
            <button
              key={zone}
              onClick={() => setZoneFilter(zone)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                zoneFilter === zone
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {zone === 'ALL' ? 'All Facility Zones' : zone}
            </button>
          ))}
        </div>
      </div>

      {/* ── OCCUPANTS GRID ── */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400" />
          Tracking live building occupants...
        </div>
      ) : filteredOccupants.length === 0 ? (
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Occupants Detected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no active visitors inside the designated facility zone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOccupants.map((occ) => {
            const mins = occ.minutes_inside || 0;
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            const isOverstay = mins >= 240;
            const isExtended = mins >= 120 && mins < 240;

            return (
              <motion.div
                key={occ.checkin_id || occ.id}
                whileHover={{ y: -3 }}
                className={`rounded-3xl p-6 border shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4 transition ${
                  isOverstay
                    ? 'bg-gradient-to-br from-[#1b0d12] to-[#0a0f1d] border-rose-500/50 shadow-rose-950/30'
                    : 'bg-[#0a0f1d] border-slate-800'
                }`}
              >
                {/* Glow accent bar on left */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isOverstay ? 'bg-rose-500' : isExtended ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />

                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-base shrink-0 shadow-md">
                        {(occ.visitor_name || 'V').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base leading-tight">{occ.visitor_name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{occ.visitor_company || 'Independent Visitor'}</p>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400">
                      {occ.badge_number || `ID-${occ.visitor_id}`}
                    </span>
                  </div>

                  {/* Duration & Progress Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Elapsed Duration:
                      </span>
                      <span
                        className={`font-black ${
                          isOverstay ? 'text-rose-400 animate-pulse' : isExtended ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {hours > 0 ? `${hours}h ` : ''}
                        {remainingMins}m inside
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverstay ? 'bg-rose-500' : isExtended ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((mins / 240) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Zone & Host Info */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location
                      </span>
                      <span className="font-bold text-white">{occ.department_name || 'Main Campus'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> Host
                      </span>
                      <span className="font-bold text-slate-300">{occ.host_name || 'Host Employee'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Security Clearance</span>
                      <span className="text-indigo-400 font-bold text-[11px] truncate max-w-[170px]">
                        {occ.security_level || 'Level 2: Workspace'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Gate Checkout Button */}
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleGateCheckout(occ)}
                    disabled={checkingOutId === (occ.checkin_id || occ.id)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-rose-600/20 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>
                      {checkingOutId === (occ.checkin_id || occ.id) ? 'Checking Out...' : 'Process Gate Check-Out'}
                    </span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
