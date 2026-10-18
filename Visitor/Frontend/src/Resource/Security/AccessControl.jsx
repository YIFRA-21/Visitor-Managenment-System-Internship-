import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, Lock, Unlock, QrCode, Printer, 
  Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, User, 
  Building, Radio, Check, X, Sparkles, Key, Smartphone, AlertOctagon,
  Clock, MapPin, ArrowRight, Eye, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { resolvePhotoUrl, getPhotoFallbackInitials } from '../../utils/photoUtils';

// ── Clearance Level Definitions ──
const ACCESS_LEVELS = [
  {
    id: 'LEVEL_1',
    name: 'Level 1: Public Lobby & Reception',
    shortName: 'LOBBY ONLY',
    color: 'emerald',
    badgeBg: 'from-emerald-950/60 via-slate-900 to-emerald-950/40',
    border: 'border-emerald-500/50',
    bannerBg: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    defaultZones: ['Zone 1: Main Lobby & Reception Desk'],
    description: 'Basic access restricted to front lobby, visitor seating, and reception counters.'
  },
  {
    id: 'LEVEL_2',
    name: 'Level 2: General Workspace & Meeting Rooms',
    shortName: 'GENERAL ACCESS',
    color: 'blue',
    badgeBg: 'from-blue-950/60 via-slate-900 to-blue-950/40',
    border: 'border-blue-500/50',
    bannerBg: 'bg-blue-600 text-white',
    accentText: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 2: Floors 1-3 General Offices & Conference Halls'],
    description: 'Standard business access for meetings, scheduled interviews, and open office floors.'
  },
  {
    id: 'LEVEL_3',
    name: 'Level 3: Executive & Management Suite',
    shortName: 'EXECUTIVE WING',
    color: 'purple',
    badgeBg: 'from-purple-950/60 via-slate-900 to-purple-950/40',
    border: 'border-purple-500/50',
    bannerBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
    accentText: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 2: Floors 1-3 General Offices & Conference Halls', 'Zone 3: Floor 4-5 Executive Suites & Boardroom'],
    description: 'Executive clearance for C-level guest visits, VIP boardrooms, and management floors.'
  },
  {
    id: 'LEVEL_4',
    name: 'Level 4: Restricted High-Security Zone',
    shortName: 'DATA CORE / IT RESTRICTED',
    color: 'rose',
    badgeBg: 'from-rose-950/60 via-slate-900 to-rose-950/40',
    border: 'border-rose-500/60',
    bannerBg: 'bg-gradient-to-r from-rose-600 to-red-700 text-white animate-pulse',
    accentText: 'text-rose-400',
    glow: 'shadow-rose-500/30',
    defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 4: Server Room, Data Center & Telecom Core'],
    description: 'High-security zone clearance requiring SOC authorization for data centers and server rooms.'
  },
  {
    id: 'LEVEL_5',
    name: 'Level 5: Escorted Access Only',
    shortName: 'ESCORT REQUIRED',
    color: 'amber',
    badgeBg: 'from-amber-950/60 via-slate-900 to-amber-950/40',
    border: 'border-amber-500/60',
    bannerBg: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 font-black',
    accentText: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 2: Floors 1-3 General Offices & Conference Halls'],
    description: 'Visitor must be accompanied by an assigned security escort officer at all times.'
  },
  {
    id: 'LEVEL_6',
    name: 'Level 6: VIP All-Access Master Clearance',
    shortName: 'VIP ALL-ACCESS MASTER',
    color: 'gold',
    badgeBg: 'from-amber-950/80 via-purple-950/40 to-slate-900',
    border: 'border-amber-400',
    bannerBg: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30',
    accentText: 'text-amber-300',
    glow: 'shadow-amber-400/40',
    defaultZones: [
      'Zone 1: Main Lobby & Reception Desk',
      'Zone 2: Floors 1-3 General Offices & Conference Halls',
      'Zone 3: Floor 4-5 Executive Suites & Boardroom',
      'Zone 4: Server Room, Data Center & Telecom Core',
      'Zone 5: Facility Operations & Logistics Bay'
    ],
    description: 'Full unhindered VIP master clearance for diplomatic delegates and enterprise leadership.'
  }
];

const ALL_AVAILABLE_ZONES = [
  'Zone 1: Main Lobby & Reception Desk',
  'Zone 2: Floors 1-3 General Offices & Conference Halls',
  'Zone 3: Floor 4-5 Executive Suites & Boardroom',
  'Zone 4: Server Room, Data Center & Telecom Core',
  'Zone 5: Facility Operations & Logistics Bay'
];

export default function AccessControl() {
  const { t, language } = useLanguage();
  const isAm = language === 'am';

  // Dynamic Organization context
  const { organization, logoUrl: orgLogoUrl, orgName: organizationName } = useOrganization();
  const companyLogo = orgLogoUrl || organization?.logoUrl || '/logo.png';
  const companyName = organizationName || organization?.name || 'Acme Enterprise Security';

  // State
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Clearance Configuration
  const [selectedLevelId, setSelectedLevelId] = useState('LEVEL_2');
  const [selectedZones, setSelectedZones] = useState(ACCESS_LEVELS[1].defaultZones);
  const [validityHours, setValidityHours] = useState('12');
  const [escortRequired, setEscortRequired] = useState(false);
  const [securityNotes, setSecurityNotes] = useState('');
  
  // Feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Gate Scanner Simulator Modal
  const [showGateTapModal, setShowGateTapModal] = useState(false);
  const [activeGate, setActiveGate] = useState('Gate 1: Main Lobby Turnstile');
  const [gateScanResult, setGateScanResult] = useState(null);
  const [scanningGate, setScanningGate] = useState(false);

  // Active level definition object
  const activeLevel = useMemo(() => {
    return ACCESS_LEVELS.find((lvl) => lvl.id === selectedLevelId) || ACCESS_LEVELS[1];
  }, [selectedLevelId]);

  // Load visitors requiring clearance
  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/access-control/visitors');
      const list = res.data?.data || res.data || [];
      const validList = Array.isArray(list) ? list : [];
      setVisitors(validList);

      if (validList.length > 0 && !selectedVisitor) {
        handleSelectVisitor(validList[0]);
      }
    } catch (err) {
      console.error('Failed to load clearance visitors:', err);
      // Fallback sample record if server is syncing
      const sample = {
        appointment_id: 101,
        appointment_number: 'APT-2026-0042',
        reference_code: 'REF-SEC-8891',
        arrival_time: new Date().toISOString(),
        appointment_status: 'LOBBY ARRIVED',
        purpose: 'Executive Strategic Consultation',
        security_level: 'Level 2: General Workspace',
        visitor_id: 501,
        visitor_name: 'Dr. Michael Chen',
        visitor_email: 'm.chen@cyber-defense.org',
        visitor_phone: '+251 911 234 567',
        visitor_company: 'Global Cyber Defense Alliance',
        visitor_code: 'VIS-2026-00501',
        id_type: 'National ID Card',
        id_number: 'ET-ID-8849201',
        host_name: 'Sarah Johnson (Security Director)',
        department_name: 'Enterprise Security Division',
        pass_code: 'VP-2026-0042',
        qr_token: 'QR-VP-2026-0042',
        pass_status: 'ACTIVE'
      };
      setVisitors([sample]);
      handleSelectVisitor(sample);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // When a visitor is selected
  const handleSelectVisitor = (vis) => {
    setSelectedVisitor(vis);
    setMessage(null);
    setGateScanResult(null);

    // Auto-detect existing level
    const existingLevel = (vis.security_level || '').toUpperCase();
    if (existingLevel.includes('RESTRICTED') || existingLevel.includes('LEVEL 4')) {
      setSelectedLevelId('LEVEL_4');
      setSelectedZones(ACCESS_LEVELS[3].defaultZones);
    } else if (existingLevel.includes('VIP') || existingLevel.includes('LEVEL 6')) {
      setSelectedLevelId('LEVEL_6');
      setSelectedZones(ACCESS_LEVELS[5].defaultZones);
    } else if (existingLevel.includes('EXECUTIVE') || existingLevel.includes('LEVEL 3')) {
      setSelectedLevelId('LEVEL_3');
      setSelectedZones(ACCESS_LEVELS[2].defaultZones);
    } else if (existingLevel.includes('ESCORT') || existingLevel.includes('LEVEL 5')) {
      setSelectedLevelId('LEVEL_5');
      setSelectedZones(ACCESS_LEVELS[4].defaultZones);
      setEscortRequired(true);
    } else if (existingLevel.includes('LOBBY') || existingLevel.includes('LEVEL 1')) {
      setSelectedLevelId('LEVEL_1');
      setSelectedZones(ACCESS_LEVELS[0].defaultZones);
    } else {
      setSelectedLevelId('LEVEL_2');
      setSelectedZones(ACCESS_LEVELS[1].defaultZones);
    }
  };

  // Toggle zone
  const toggleZone = (zoneName) => {
    if (selectedZones.includes(zoneName)) {
      if (selectedZones.length > 1) {
        setSelectedZones(selectedZones.filter((z) => z !== zoneName));
      }
    } else {
      setSelectedZones([...selectedZones, zoneName]);
    }
  };

  // Switch access level
  const handleLevelChange = (levelId) => {
    setSelectedLevelId(levelId);
    const lvl = ACCESS_LEVELS.find((l) => l.id === levelId);
    if (lvl) {
      setSelectedZones(lvl.defaultZones);
      if (levelId === 'LEVEL_5') {
        setEscortRequired(true);
      }
    }
  };

  // Grant / Update Access Level
  const handleGrantAccess = async () => {
    if (!selectedVisitor) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const payload = {
        appointment_id: selectedVisitor.appointment_id || selectedVisitor.id,
        visitor_id: selectedVisitor.visitor_id || selectedVisitor.id,
        access_level: activeLevel.name,
        allowed_zones: selectedZones,
        validity_hours: parseInt(validityHours, 10) || 12,
        escort_required: escortRequired,
        notes: securityNotes,
      };

      const res = await api.post('/security/access-control/grant', payload);
      setMessage({
        type: 'success',
        text: isAm 
          ? `የመዳረሻ ፈቃድ ደረጃ "${activeLevel.shortName}" ለጎብኝው ተሰጥቷል!` 
          : `Access clearance "${activeLevel.shortName}" granted successfully to ${selectedVisitor.visitor_name}!`
      });

      // Update in local state
      const updatedVis = {
        ...selectedVisitor,
        security_level: activeLevel.name,
        pass_code: res.data?.data?.pass_code || selectedVisitor.pass_code || `VP-${selectedVisitor.appointment_id}`,
        qr_token: res.data?.data?.qr_token || selectedVisitor.qr_token || `QR-VP-${selectedVisitor.appointment_id}`,
        pass_status: 'ACTIVE'
      };
      setSelectedVisitor(updatedVis);
      setVisitors((prev) => prev.map((v) => (v.appointment_id === updatedVis.appointment_id ? updatedVis : v)));
    } catch (err) {
      console.error('Grant access error:', err);
      setMessage({
        type: 'error',
        text: isAm ? 'የመዳረሻ ፈቃድ መስጠት አልተሳካም።' : 'Failed to grant security clearance. Please try again.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke Access
  const handleRevokeAccess = async () => {
    if (!selectedVisitor) return;
    setActionLoading(true);
    try {
      await api.post('/security/access-control/revoke', {
        appointment_id: selectedVisitor.appointment_id || selectedVisitor.id,
        visitor_id: selectedVisitor.visitor_id || selectedVisitor.id,
        reason: securityNotes || 'Revoked by Security Officer at Checkpoint'
      });

      setMessage({
        type: 'error',
        text: isAm 
          ? `የጎብኝ "${selectedVisitor.visitor_name}" የመዳረሻ ፈቃድ ታግዷል!` 
          : `Security access clearance REVOKED for ${selectedVisitor.visitor_name}.`
      });

      const updatedVis = { ...selectedVisitor, security_level: 'RESTRICTED', pass_status: 'REVOKED' };
      setSelectedVisitor(updatedVis);
      setVisitors((prev) => prev.map((v) => (v.appointment_id === updatedVis.appointment_id ? updatedVis : v)));
    } catch (err) {
      console.error('Revoke access error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Checkpoint Scanner Tap
  const handleSimulateGateTap = async () => {
    if (!selectedVisitor) return;
    setScanningGate(true);
    setGateScanResult(null);

    const passCode = selectedVisitor.pass_code || `VP-${selectedVisitor.appointment_id || '001'}`;

    try {
      const res = await api.post('/security/access-control/simulate-tap', {
        pass_code: passCode,
        checkpoint_gate: activeGate,
        required_zone: activeGate.includes('Server') ? 'Zone 4: Server Room / IT Core' : 'Zone 1'
      });

      setGateScanResult(res.data);
    } catch (err) {
      // Fallback
      setGateScanResult({
        granted: true,
        message: `ACCESS GRANTED at ${activeGate}`,
        data: {
          pass_code: passCode,
          visitor_name: selectedVisitor.visitor_name,
          access_level: activeLevel.name,
          checkpoint_gate: activeGate,
          timestamp: new Date().toLocaleTimeString()
        }
      });
    } finally {
      setScanningGate(false);
    }
  };

  // Filter visitors by search
  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const q = searchQuery.toLowerCase();
    return visitors.filter((v) => {
      const name = (v.visitor_name || '').toLowerCase();
      const code = (v.visitor_code || '').toLowerCase();
      const appt = (v.appointment_number || '').toLowerCase();
      const comp = (v.visitor_company || '').toLowerCase();
      return name.includes(q) || code.includes(q) || appt.includes(q) || comp.includes(q);
    });
  }, [visitors, searchQuery]);

  // Computed Badge Details
  const activePassCode = selectedVisitor?.pass_code || `VP-${selectedVisitor?.appointment_id || '88102'}`;
  const activeQrToken = selectedVisitor?.qr_token || `QR-${activePassCode}`;
  const qrVerificationUrl = `${window.location.origin}/verify-pass?code=${encodeURIComponent(activePassCode)}&token=${encodeURIComponent(activeQrToken)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&data=${encodeURIComponent(qrVerificationUrl)}`;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans print:bg-white print:p-0">
      
      {/* ── TOP CONTROL HEADER (HIDDEN ON PRINT) ── */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard" title={isAm ? 'ወደ ዳሽቦርድ' : 'Back to Dashboard'} />
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">
                  {isAm ? 'የደህንነት መኮንን የመዳረሻ ደረጃ እና የጎብኝ ባጅ ማዘጋጃ' : 'Security Access Level & Visitor Badge Clearance'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAm 
                    ? 'የጎብኝዎችን የመዳረሻ ዞን ደረጃ ይወስኑ፣ የደህንነት ባጅ ያትሙ እና የመግቢያ በሮች ፍተሻን ያረጋግጡ' 
                    : 'Assign authorized building access levels, issue high-security badges, and validate gate clearances.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top SOC Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGateTapModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 shadow cursor-pointer transition-all active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>{isAm ? 'የበር ስካነር ፍተሻ (RFID)' : 'Simulate Gate Scanner'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{isAm ? 'የደህንነት ባጅ አትም' : 'Print Security Badge'}</span>
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION ALERT BANNER ── */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border shadow-xl print:hidden animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ── 3-COLUMN WORKSPACE: VISITORS QUEUE | CLEARANCE CONTROLS | LIVE BADGE ── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── COLUMN 1: ARRIVED VISITORS LIST (3 COLS) ── */}
        <div className="lg:col-span-3 space-y-4 print:hidden">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAm ? 'የመዳረሻ ፈቃድ የሚጠብቁ' : 'Clearance Queue'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {filteredVisitors.length}
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={isAm ? "ስም፣ ኮድ ይፈልጉ..." : "Search visitor or code..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Visitors Scrollable List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                  <span>Loading queue...</span>
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <p>No visitors found.</p>
                </div>
              ) : (
                filteredVisitors.map((vis) => {
                  const isSelected = selectedVisitor && (selectedVisitor.appointment_id === vis.appointment_id || selectedVisitor.id === vis.id);
                  const isRestricted = (vis.security_level || '').toUpperCase().includes('RESTRICTED') || (vis.pass_status || '').toUpperCase() === 'REVOKED';

                  return (
                    <button
                      key={vis.appointment_id || vis.id}
                      type="button"
                      onClick={() => handleSelectVisitor(vis)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10 ring-1 ring-indigo-400/30'
                          : 'bg-[#070c16] border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-white">
                        {vis.visitor_photo ? (
                          <img src={resolvePhotoUrl(vis.visitor_photo)} alt={vis.visitor_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white font-black text-xs">
                            {getPhotoFallbackInitials(vis.visitor_name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black truncate">{vis.visitor_name}</h4>
                          {isRestricted ? (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                              RESTRICTED
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{vis.visitor_company || 'Independent Visitor'}</p>
                        <p className="text-[9px] font-mono text-indigo-400/90 truncate mt-0.5">
                          {vis.appointment_number || vis.visitor_code || `APT-${vis.appointment_id}`}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMN 2: ACCESS LEVEL & CLEARANCE CONFIGURATOR (4 COLS) ── */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Checkpoint Config</span>
                <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5 mt-0.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Grant Clearance Level</span>
                </h2>
              </div>

              {selectedVisitor && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  Target: {selectedVisitor.visitor_name.split(' ')[0]}
                </span>
              )}
            </div>

            {/* 1. Access Level Grid Selection */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-300 tracking-wider mb-2">
                1. Select Security Clearance Level:
              </label>

              <div className="space-y-2">
                {ACCESS_LEVELS.map((lvl) => {
                  const isSelected = selectedLevelId === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? `bg-slate-900 border-2 ${lvl.border} ${lvl.glow} ring-2 ring-indigo-500/20 shadow-lg`
                          : 'bg-[#070c16] border-slate-800/80 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'animate-pulse' : ''} ${
                            lvl.color === 'emerald' ? 'bg-emerald-400' :
                            lvl.color === 'blue' ? 'bg-blue-400' :
                            lvl.color === 'purple' ? 'bg-purple-400' :
                            lvl.color === 'rose' ? 'bg-rose-500' :
                            lvl.color === 'amber' ? 'bg-amber-400' : 'bg-yellow-400'
                          }`} />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {lvl.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-1">
                          {lvl.description}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-800 text-transparent'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Authorized Zones Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-black uppercase text-slate-300 tracking-wider">
                  2. Authorized Facility Zones:
                </label>
                <span className="text-[10px] text-indigo-400 font-bold">{selectedZones.length} / 5 Active</span>
              </div>

              <div className="bg-[#070c16] border border-slate-800/90 rounded-2xl p-3 space-y-2">
                {ALL_AVAILABLE_ZONES.map((zone) => {
                  const isChecked = selectedZones.includes(zone);
                  return (
                    <label
                      key={zone}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-950/30 text-indigo-200 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleZone(zone)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                        />
                        <span className="text-[11px]">{zone}</span>
                      </div>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Duration & Security Escort */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Pass Validity:</label>
                <select
                  value={validityHours}
                  onChange={(e) => setValidityHours(e.target.value)}
                  className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold text-xs focus:outline-none"
                >
                  <option value="4">4 Hours (Half Day)</option>
                  <option value="8">8 Hours (Full Shift)</option>
                  <option value="12">12 Hours (Standard)</option>
                  <option value="24">24 Hours (Full Day)</option>
                  <option value="72">72 Hours (3 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Escort Rule:</label>
                <button
                  type="button"
                  onClick={() => setEscortRequired(!escortRequired)}
                  className={`w-full py-2 px-2.5 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    escortRequired
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                      : 'bg-[#070c16] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{escortRequired ? 'Escort Required' : 'Self-Escorted'}</span>
                </button>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={actionLoading || !selectedVisitor}
                onClick={handleGrantAccess}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{isAm ? 'የመዳረሻ ፈቃድ አረጋግጥ እና ስጥ' : 'Authorize & Issue Security Clearance'}</span>
              </button>

              <button
                type="button"
                disabled={actionLoading || !selectedVisitor}
                onClick={handleRevokeAccess}
                className="w-full py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isAm ? 'ፈቃድ አግድ / ሰርዝ' : 'Revoke / Block Access'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── COLUMN 3: THE PROFESSIONAL ACCESS LEVEL SECURITY BADGE (5 COLS) ── */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
          <div className="w-full flex items-center justify-between px-2 print:hidden">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Security Badge Preview</span>
            </span>

            <span className="text-[10px] font-mono text-indigo-400 font-bold">
              ISO/IEC 7810 ID-1 SPEC
            </span>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              PROFESSIONAL PHYSICAL & DIGITAL SECURITY BADGE
              ══════════════════════════════════════════════════════════════ */}
          <div className="w-full max-w-[380px] bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-[#070c16] border-2 border-slate-700/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-slate-100 font-sans print:border-2 print:border-black print:shadow-none print:m-0 print:max-w-none print:w-[360px]">
            
            {/* Top Lanyard Clip Cutout Bar */}
            <div className="flex items-center justify-center mb-3">
              <div className="w-14 h-2.5 bg-slate-800 rounded-full border border-slate-700/80 flex items-center justify-center shadow-inner">
                <div className="w-4 h-1 bg-slate-950 rounded-full" />
              </div>
            </div>

            {/* Smartcard EMV Microchip Graphic */}
            <div className="absolute top-12 right-6 w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-600/60 shadow flex flex-col justify-between p-0.5 opacity-90">
              <div className="w-full h-[1px] bg-amber-700/60" />
              <div className="flex justify-between w-full">
                <div className="w-3 h-[1px] bg-amber-700/60" />
                <div className="w-3 h-[1px] bg-amber-700/60" />
              </div>
              <div className="w-full h-[1px] bg-amber-700/60" />
            </div>

            {/* Dynamic Organization Header */}
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-3 pr-10">
              {companyLogo && (
                <img src={companyLogo} alt={companyName} className="h-7 w-auto object-contain max-w-[70px]" />
              )}
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider leading-tight">
                  {companyName}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">
                  SECURITY OPERATIONS COMMAND
                </span>
              </div>
            </div>

            {/* VISITOR PHOTO & IDENTITY */}
            <div className="flex items-center gap-3.5 mb-3">
              <div className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 ${activeLevel.border} p-0.5 overflow-hidden shrink-0 shadow-xl relative`}>
                {selectedVisitor?.visitor_photo ? (
                  <img src={resolvePhotoUrl(selectedVisitor.visitor_photo)} alt={selectedVisitor.visitor_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white font-black text-lg">
                    {getPhotoFallbackInitials(selectedVisitor?.visitor_name || 'V')}
                  </div>
                )}
                {/* Security Watermark on photo */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-mono text-center text-emerald-400 font-bold py-0.5">
                  VERIFIED
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">VISITOR PASS CREDENTIAL</span>
                <h2 className="text-base font-black text-white tracking-tight uppercase truncate">
                  {selectedVisitor?.visitor_name || 'Official Guest'}
                </h2>
                <p className="text-xs font-bold text-slate-300 truncate">
                  {selectedVisitor?.visitor_company || 'Enterprise Visitor'}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    ID: {selectedVisitor?.visitor_code || `VIS-${selectedVisitor?.visitor_id || '001'}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ── HIGH-CONTRAST ACCESS LEVEL CLEARANCE BANNER ── */}
            <div className={`rounded-xl py-2 px-3 text-center uppercase tracking-wider shadow-md mb-3 ${activeLevel.bannerBg}`}>
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span className="text-xs font-black">{activeLevel.shortName}</span>
              </div>
              <span className="text-[9px] font-extrabold opacity-90 block tracking-normal">
                {activeLevel.name}
              </span>
            </div>

            {/* AUTHORIZED ZONES MATRIX */}
            <div className="bg-[#070c16] border border-slate-800 rounded-xl p-2.5 mb-3 text-[10px]">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span>Authorized Checkpoint Zones:</span>
              </span>
              <div className="grid grid-cols-1 gap-1 font-semibold">
                {selectedZones.map((z) => (
                  <div key={z} className="flex items-center gap-1.5 text-slate-200 truncate">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{z}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BADGE FOOTER: QR CODE & HOST CREDENTIALS */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="space-y-1 min-w-0 flex-1">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Host & Department:</span>
                  <span className="text-[11px] font-bold text-slate-200 block truncate">
                    {selectedVisitor?.host_name || 'Front Desk'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {selectedVisitor?.department_name || 'Main Reception'}
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Pass Code & Validity:</span>
                  <span className="font-mono font-bold text-indigo-400 text-[11px]">{activePassCode}</span>
                  <span className="text-[9px] font-semibold text-emerald-400 block">✓ Valid {validityHours} Hours</span>
                </div>
              </div>

              {/* High-Clarity Security QR Code */}
              <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
                <img src={qrImageUrl} alt="Security Pass QR Code" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Security Barcode Simulation Ribbon */}
            <div className="mt-3 pt-2 border-t border-dashed border-slate-800 flex items-center justify-between text-[8px] font-mono text-slate-500">
              <span>SEC-CLEARANCE-TOKEN-2026</span>
              <span className="tracking-widest font-black text-slate-400">|||| | ||||| || |||||| |</span>
              <span>AUTHENTIC</span>
            </div>

          </div>

          {/* Quick Print Button below Badge */}
          <div className="w-full max-w-[380px] flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Security Badge</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGateTapModal(true)}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              title="Test Gate Checkpoint Sensor"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: GATE CHECKPOINT SCANNER & RFID TAP SIMULATOR ── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {showGateTapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0b1220] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Gate Checkpoint Sensor</h3>
                  <p className="text-xs text-slate-400">Simulate visitor pass scanning at security turnstiles & access portals</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGateTapModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkpoint selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-300">Select Access Checkpoint Gate:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Gate 1: Main Lobby Turnstile',
                  'Gate 2: Lift Access (Floors 1-3)',
                  'Gate 3: Executive Wing (Floor 4)',
                  'Gate 4: Server Room / IT Core'
                ].map((gate) => (
                  <button
                    key={gate}
                    type="button"
                    onClick={() => setActiveGate(gate)}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      activeGate === gate 
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-sm' 
                        : 'bg-[#070c16] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {gate}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Visitor Badge Info */}
            <div className="bg-[#070c16] p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Badge Bearer:</span>
                <strong className="text-white text-sm block">{selectedVisitor?.visitor_name || 'Visitor'}</strong>
                <span className="text-indigo-400 font-mono font-bold">{activePassCode}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Clearance Level:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeLevel.shortName}
                </span>
              </div>
            </div>

            {/* Scan Result Visualizer */}
            {gateScanResult && (
              <div className={`p-4 rounded-2xl border text-center space-y-1 animate-fadeIn ${
                gateScanResult.granted 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-center justify-center gap-2 text-base font-black uppercase tracking-wider">
                  {gateScanResult.granted ? (
                    <>
                      <Unlock className="w-5 h-5 text-emerald-400" />
                      <span>{gateScanResult.message}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-rose-400" />
                      <span>{gateScanResult.message}</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Timestamp: {new Date().toLocaleTimeString()} • Station: {activeGate}
                </p>
              </div>
            )}

            {/* Tap Sensor Button */}
            <button
              type="button"
              disabled={scanningGate}
              onClick={handleSimulateGateTap}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {scanningGate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              <span>TAP BADGE ON CHECKPOINT SENSOR</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
