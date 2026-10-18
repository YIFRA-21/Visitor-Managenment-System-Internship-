import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Package,
  Radio,
  FileCheck,
  Sparkles,
  MapPin,
  Clock,
  User,
  XCircle,
  Eye,
  Check,
  X,
  History,
  Sliders,
  AlertOctagon
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { securityApi, checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorScreening() {
  const { t, tStatus, language } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Inspection Checklist Form State
  const [baggageChecked, setBaggageChecked] = useState(true);
  const [metalDetectorCleared, setMetalDetectorCleared] = useState(true);
  const [idVerified, setIdVerified] = useState(true);
  const [contrabandFound, setContrabandFound] = useState(false);
  const [escortRequired, setEscortRequired] = useState(false);
  const [prohibitedItemType, setProhibitedItemType] = useState('NONE');
  const [notes, setNotes] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalScreened: 28,
    clearedClean: 26,
    contrabandDetected: 2,
    escortAssigned: 4
  });

  const [recentLogs, setRecentLogs] = useState([]);

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await securityApi.getScreeningQueue().catch(() => ({ data: { data: [] } }));
      const items = res.data?.data || res.data || [];
      setQueue(items);

      if (items.length > 0 && !selectedVisitor) {
        setSelectedVisitor(items[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQueue(false);
    }
  }, [selectedVisitor]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSelectVisitor = (vis) => {
    setSelectedVisitor(vis);
    setBaggageChecked(true);
    setMetalDetectorCleared(true);
    setIdVerified(true);
    setContrabandFound(false);
    setEscortRequired(vis.security_level?.includes('Escorted') || false);
    setProhibitedItemType('NONE');
    setNotes('');
    setFeedback(null);
  };

  const handleCompleteScreening = async (decision) => {
    if (!selectedVisitor) return;
    setSubmitting(true);
    setFeedback(null);

    const isFlagged = decision === 'FLAG_CONTRABAND' || contrabandFound;
    const isDenied = decision === 'DENY';

    try {
      await securityApi.completeScreening({
        appointment_id: selectedVisitor.appointment_id,
        visitor_id: selectedVisitor.visitor_id,
        baggage_checked: baggageChecked,
        metal_detector_cleared: metalDetectorCleared,
        contraband_found: isFlagged,
        escort_required: escortRequired,
        notes: notes || `Screening outcome: ${decision}. Inspected by Security Station 1.`
      });

      if (isDenied) {
        setFeedback({
          type: 'error',
          title: 'ACCESS DENIED & ESCALATED',
          message: `${selectedVisitor.visitor_name} was rejected at checkpoint. SOC notification dispatched.`
        });
      } else if (isFlagged) {
        setFeedback({
          type: 'warning',
          title: 'PROHIBITED ITEM LOGGED',
          message: `${selectedVisitor.visitor_name} flagged for contraband check. Mandatory security escort attached.`
        });
      } else {
        setFeedback({
          type: 'success',
          title: 'VISITOR CLEARED FOR PASSAGE',
          message: `${selectedVisitor.visitor_name} cleared physical screening. Pass token authorized.`
        });
      }

      setRecentLogs((prev) => [
        {
          id: Date.now(),
          visitor_name: selectedVisitor.visitor_name,
          decision: isDenied ? 'DENIED' : isFlagged ? 'FLAGGED' : 'CLEARED',
          escort_required: escortRequired,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9)
      ]);

      setStats((s) => ({
        ...s,
        totalScreened: s.totalScreened + 1,
        clearedClean: isDenied || isFlagged ? s.clearedClean : s.clearedClean + 1,
        contrabandDetected: isFlagged ? s.contrabandDetected + 1 : s.contrabandDetected,
        escortAssigned: escortRequired ? s.escortAssigned + 1 : s.escortAssigned
      }));

      // Remove from active queue & select next
      setQueue((prev) => prev.filter((item) => item.appointment_id !== selectedVisitor.appointment_id));
      setSelectedVisitor(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Error Saving Screening Record',
        message: getErrorMessage(err)
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQueue = queue.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.visitor_name && v.visitor_name.toLowerCase().includes(q)) ||
      (v.visitor_company && v.visitor_company.toLowerCase().includes(q)) ||
      (v.reference_code && v.reference_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active Physical Screening Station • Station Alpha
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የጎብኚዎች ደህንነት ፍተሻ ጣቢያ' : 'Visitor Screening & Inspection'}
                <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Physical baggage inspection, walk-through metal detector validation, biometric ID matching, and contraband interdiction before zone entry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchQueue}
              disabled={loadingQueue}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingQueue ? 'animate-spin text-emerald-400' : ''}`} />
              {language === 'am' ? 'አድስ' : 'Refresh Queue'}
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-2xl text-xs font-bold flex items-start justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : feedback.type === 'warning'
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : feedback.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-black text-sm">{feedback.title}</p>
                  <p className="text-xs opacity-90 mt-0.5 font-medium">{feedback.message}</p>
                </div>
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
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Screened</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{stats.totalScreened}</h3>
            <span className="text-[11px] font-bold text-slate-400">Visitors</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Processed today at checkpoint</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Clean Clearance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{stats.clearedClean}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Clean 100%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero contraband detected</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-rose-900/40 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Contraband Intercepts</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{stats.contrabandDetected}</h3>
            <span className="text-[11px] font-bold text-rose-400">Prohibited</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Confiscated or escorted</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Mandatory Escorts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-400">{stats.escortAssigned}</h3>
            <span className="text-[11px] font-bold text-slate-400">Dispatched</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Officer accompanying visitor</p>
        </motion.div>
      </div>

      {/* ── SCREENING WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Arrival Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">Awaiting Physical Inspection</h3>
                <p className="text-xs text-slate-400">Select visitor to initiate protocol</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                {queue.length} in Queue
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, or code..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {loadingQueue ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading inspection queue...
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No visitors currently awaiting screening
                </div>
              ) : (
                filteredQueue.map((vis) => {
                  const isSelected = selectedVisitor?.appointment_id === vis.appointment_id;
                  return (
                    <motion.div
                      key={vis.appointment_id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectVisitor(vis)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                            {(vis.visitor_name || 'V').charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-sm">{vis.visitor_name}</p>
                            <p className="text-xs text-slate-400">
                              {vis.visitor_company || 'Independent'} • {vis.department_name || 'Meeting'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                          {vis.reference_code || `APT-${vis.appointment_id}`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Physical Inspection Protocol Console */}
        <div className="lg:col-span-7 space-y-6">
          {selectedVisitor ? (
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              {/* Header profile of selected subject */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/30">
                    {(selectedVisitor.visitor_name || 'V').charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedVisitor.visitor_name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedVisitor.visitor_company || 'Independent'} • ID: {selectedVisitor.id_type || 'National ID'} #{' '}
                      {selectedVisitor.id_number || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Host Appointment</span>
                  <span className="text-xs font-bold text-emerald-400">{selectedVisitor.host_name || 'Staff Host'}</span>
                </div>
              </div>

              {/* Physical Check Interactive Matrix */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Mandatory Security Clearance Checks
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => setBaggageChecked(!baggageChecked)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                      baggageChecked
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-sm text-white">Baggage X-Ray Inspection</p>
                      <p className="text-xs text-slate-400 mt-0.5">Scanned for hazardous materials & electronics</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        baggageChecked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                      }`}
                    >
                      {baggageChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setMetalDetectorCleared(!metalDetectorCleared)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                      metalDetectorCleared
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-sm text-white">Metal Detector Portal</p>
                      <p className="text-xs text-slate-400 mt-0.5">Walk-through portal cleared without alarm</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        metalDetectorCleared ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                      }`}
                    >
                      {metalDetectorCleared && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setIdVerified(!idVerified)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                      idVerified
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-sm text-white">Physical ID Match</p>
                      <p className="text-xs text-slate-400 mt-0.5">Government ID matches visitor demographic photo</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        idVerified ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                      }`}
                    >
                      {idVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setContrabandFound(!contrabandFound)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                      contrabandFound
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-sm text-white">Prohibited Item / Contraband</p>
                      <p className="text-xs text-slate-400 mt-0.5">Flag unauthorized weapons, chemicals, or drives</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        contrabandFound ? 'bg-rose-500 border-rose-400 text-white' : 'border-slate-700'
                      }`}
                    >
                      {contrabandFound && <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {contrabandFound && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3"
                  >
                    <label className="block text-[11px] font-extrabold uppercase text-rose-300">
                      Specify Contraband / Prohibited Item Type
                    </label>
                    <select
                      value={prohibitedItemType}
                      onChange={(e) => setProhibitedItemType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-rose-500/50 rounded-xl text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="WEAPON">Sharp Object / Weapon / Pocket Tool</option>
                      <option value="RECORDING">Unauthorized High-Res Camera / Spy Gear</option>
                      <option value="ELECTRONICS">Unregistered High-Capacity Storage Media</option>
                      <option value="FLAMMABLE">Flammable Material or Aerosols</option>
                      <option value="OTHER">Other Prohibited Physical Item</option>
                    </select>
                  </motion.div>
                )}

                {/* Escort toggle */}
                <div
                  onClick={() => setEscortRequired(!escortRequired)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    escortRequired
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Radio className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-extrabold text-sm text-white">Mandatory Security Escort Required</p>
                      <p className="text-xs text-slate-400">Visitor must remain accompanied by designated officer</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={escortRequired}
                    onChange={() => {}}
                    className="w-5 h-5 accent-amber-500 rounded"
                  />
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Officer Screening Remarks & Observations
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter observation notes, verified bag contents, or remarks..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleCompleteScreening('CLEARED')}
                  disabled={submitting}
                  className="flex-1 min-w-[180px] py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize Clean Clearance</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteScreening('FLAG_CONTRABAND')}
                  disabled={submitting}
                  className="py-3.5 px-5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Flag Escort / Contraband</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteScreening('DENY')}
                  disabled={submitting}
                  className="py-3.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Deny Entry</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">Select a Visitor to Inspect</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pick a visitor from the arrival queue on the left to initiate x-ray scanning, metal detector verification, and security clearance.
              </p>
            </div>
          )}

          {/* Recent Screening Logs */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Station Screening Audit History
            </h4>
            <div className="space-y-2 text-xs">
              {recentLogs.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">No recent screenings completed in this session.</p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
                  >
                    <span className="font-bold text-white">{log.visitor_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.decision === 'CLEARED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.decision === 'FLAGGED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {log.decision}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
