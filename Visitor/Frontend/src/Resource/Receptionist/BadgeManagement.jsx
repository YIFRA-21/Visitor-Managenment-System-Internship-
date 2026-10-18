import React, { useState, useEffect, useRef } from 'react';
import { 
    CreditCard, Shield, ShieldAlert, ShieldCheck, AlertTriangle, Lock, Unlock, 
    Key, QrCode, Printer, Download, RefreshCw, UserCheck, Radio, FileText, 
    Sparkles, Eye, CheckCircle2, Layers, Wifi, Cpu, Fingerprint, Camera, 
    ExternalLink, Share2, Copy, RotateCcw, Sliders, MapPin, Flame, Check, 
    X, Search, Clock, ArrowRight, User, Building, Phone, ChevronDown, 
    ChevronUp, AlertOctagon, CheckCheck, Scan, Smartphone, Info, Award,
    SlidersHorizontal, Compass, HelpCircle, HardDrive, Zap, Tag, Trash2, XCircle
} from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { resolvePhotoUrl, getPhotoFallbackInitials } from '../../utils/photoUtils';

// ── SECURITY CLEARANCE LEVELS (ACCESS CONTROL MATRIX) ──
const ACCESS_LEVELS = [
    {
        id: 'LEVEL_1',
        name: 'LEVEL 1: PUBLIC LOBBY & RECEPTION',
        shortName: 'LOBBY ONLY',
        color: 'emerald',
        hexColor: '#059669',
        badgeBg: 'from-emerald-950/60 via-slate-900 to-emerald-950/40',
        border: 'border-emerald-500/50',
        bannerBg: 'bg-emerald-600 text-white',
        accentText: 'text-emerald-400',
        glow: 'shadow-emerald-500/20',
        dotColor: 'bg-emerald-400',
        defaultZones: ['Zone 1: Main Lobby & Reception Desk'],
        description: 'Basic access restricted to front lobby, visitor seating, and reception counters.'
    },
    {
        id: 'LEVEL_2',
        name: 'LEVEL 2: GENERAL WORKSPACE & MEETING ROOMS',
        shortName: 'GENERAL ACCESS',
        color: 'blue',
        hexColor: '#2563eb',
        badgeBg: 'from-blue-950/60 via-slate-900 to-blue-950/40',
        border: 'border-blue-500/50',
        bannerBg: 'bg-blue-600 text-white',
        accentText: 'text-blue-400',
        glow: 'shadow-blue-500/20',
        dotColor: 'bg-blue-400',
        defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 2: Floors 1-3 General Offices & Conference Halls'],
        description: 'Standard business access for meetings, scheduled interviews, and open office floors.'
    },
    {
        id: 'LEVEL_3',
        name: 'LEVEL 3: EXECUTIVE & MANAGEMENT SUITE',
        shortName: 'EXECUTIVE WING',
        color: 'purple',
        hexColor: '#7c3aed',
        badgeBg: 'from-purple-950/60 via-slate-900 to-purple-950/40',
        border: 'border-purple-500/50',
        bannerBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
        accentText: 'text-purple-400',
        glow: 'shadow-purple-500/20',
        dotColor: 'bg-purple-400',
        defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 2: Floors 1-3 General Offices & Conference Halls', 'Zone 3: Floor 4-5 Executive Suites & Boardroom'],
        description: 'Executive clearance for C-level guest visits, VIP boardrooms, and management floors.'
    },
    {
        id: 'LEVEL_4',
        name: 'LEVEL 4: RESTRICTED HIGH-SECURITY ZONE',
        shortName: 'DATA CORE / IT RESTRICTED',
        color: 'rose',
        hexColor: '#dc2626',
        badgeBg: 'from-rose-950/60 via-slate-900 to-rose-950/40',
        border: 'border-rose-500/60',
        bannerBg: 'bg-gradient-to-r from-rose-600 to-red-700 text-white',
        accentText: 'text-rose-400',
        glow: 'shadow-rose-500/30',
        dotColor: 'bg-rose-500',
        defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 4: Server Room, Data Center & Telecom Core'],
        description: 'High-security zone clearance requiring SOC authorization for data centers and server rooms.'
    },
    {
        id: 'LEVEL_5',
        name: 'LEVEL 5: ESCORTED ACCESS ONLY',
        shortName: 'ESCORT REQUIRED',
        color: 'amber',
        hexColor: '#d97706',
        badgeBg: 'from-amber-950/60 via-slate-900 to-amber-950/40',
        border: 'border-amber-500/60',
        bannerBg: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 font-black',
        accentText: 'text-amber-400',
        glow: 'shadow-amber-500/20',
        dotColor: 'bg-amber-400',
        defaultZones: ['Zone 1: Main Lobby & Reception Desk', 'Zone 2: Floors 1-3 General Offices & Conference Halls'],
        description: 'Visitor must be accompanied by an assigned security escort officer at all times.'
    },
    {
        id: 'LEVEL_6',
        name: 'LEVEL 6: VIP ALL-ACCESS MASTER CLEARANCE',
        shortName: 'VIP ALL-ACCESS MASTER',
        color: 'gold',
        hexColor: '#b45309',
        badgeBg: 'from-amber-950/80 via-purple-950/40 to-slate-900',
        border: 'border-amber-400',
        bannerBg: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30',
        accentText: 'text-amber-300',
        glow: 'shadow-amber-400/40',
        dotColor: 'bg-yellow-400',
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

// ── RESTRICTED ZONES PRESETS ──
const RESTRICTED_ZONES = [
    {
        id: 'ZONE-A',
        code: 'ZONE 01: DATACENTER',
        title: 'Tier-4 Datacenter & Cloud Server Halls',
        facility: 'Sub-Level B1 - Server Halls A, B & C',
        level: 'LEVEL 4: RESTRICTED',
        levelNum: 4,
        theme: 'crimson',
        escortRequired: true,
        ppeRequired: 'Anti-Static ESD Smock & Booties',
        accessDoors: ['SEC-DOOR-101', 'SEC-DOOR-102', 'CAGE-4A'],
        allowedHours: '08:00 - 18:00',
        badgeColor: '#dc2626',
        badgeBorder: 'border-red-500/80',
        badgeGradient: 'from-red-950/90 via-slate-900 to-black',
        description: 'Critical enterprise servers, core switching fabrics, and physical storage arrays.'
    },
    {
        id: 'ZONE-B',
        code: 'ZONE 02: CASH & ASSET VAULT',
        title: 'Central Treasury & Secure Asset Vault',
        facility: 'Sub-Level B2 - Reinforced Vault Perimeter',
        level: 'LEVEL 5: MAXIMUM CLEARANCE',
        levelNum: 5,
        theme: 'gold',
        escortRequired: true,
        ppeRequired: 'Dual-Key Escort & Video Recording',
        accessDoors: ['VAULT-AIRLOCK-1', 'VAULT-INNER-2'],
        allowedHours: '09:00 - 16:00',
        badgeColor: '#f59e0b',
        badgeBorder: 'border-amber-500/80',
        badgeGradient: 'from-amber-950/80 via-slate-900 to-black',
        description: 'Physical treasury reserve, cryptographic hardware security modules (HSM), and master token keys.'
    },
    {
        id: 'ZONE-C',
        code: 'ZONE 03: R&D BIOLAB & HARDWARE',
        title: 'Proprietary Research & Prototype Lab',
        facility: 'Building Delta - 3rd Floor Cleanrooms',
        level: 'LEVEL 4: RESTRICTED',
        levelNum: 4,
        theme: 'cyan',
        escortRequired: true,
        ppeRequired: 'Cleanroom Suit Class 1000 & Face Shield',
        accessDoors: ['R&D-CLEAN-01', 'PROTOTYPE-BAY-3'],
        allowedHours: '08:00 - 20:00',
        badgeColor: '#06b6d4',
        badgeBorder: 'border-cyan-500/80',
        badgeGradient: 'from-cyan-950/80 via-slate-900 to-black',
        description: 'Next-generation patent development, microelectronics cleanrooms, and confidential test benches.'
    },
    {
        id: 'ZONE-D',
        code: 'ZONE 04: EXECUTIVE BOARDROOM',
        title: 'Executive Suite & Strategic Command',
        facility: 'Tower Alpha - 42nd Floor Penthouse Command',
        level: 'LEVEL 3: CONFIDENTIAL',
        levelNum: 3,
        theme: 'navy',
        escortRequired: false,
        ppeRequired: 'Smart Business / Executive Attire',
        accessDoors: ['EXEC-ELEV-42', 'BOARDROOM-MAIN'],
        allowedHours: '07:30 - 21:00',
        badgeColor: '#3b82f6',
        badgeBorder: 'border-blue-500/80',
        badgeGradient: 'from-blue-950/80 via-slate-900 to-black',
        description: 'Board of Directors chambers, Chief Executive offices, and closed-door deliberation rooms.'
    },
    {
        id: 'ZONE-E',
        code: 'ZONE 05: SCADA & HIGH-VOLTAGE',
        title: 'Industrial SCADA & Power Substation',
        facility: 'East Campus - High Voltage Yard B',
        level: 'LEVEL 4: RESTRICTED',
        levelNum: 4,
        theme: 'hazard',
        escortRequired: true,
        ppeRequired: 'Arc-Flash Shield, Dielectric Boots & Hard Hat',
        accessDoors: ['SUBSTATION-GATE-B', 'SCADA-CONTROL-1'],
        allowedHours: '08:00 - 17:00',
        badgeColor: '#ea580c',
        badgeBorder: 'border-orange-500/80',
        badgeGradient: 'from-orange-950/80 via-slate-900 to-black',
        description: 'Facility primary power substations, backup diesel turbine generators, and chilled water loops.'
    }
];

// ── AVAILABLE SECURITY ESCORT OFFICERS ──
const ESCORT_OFFICERS = [
    { id: 'OFF-804', name: 'Officer Marcus Vance', badge: 'SEC-804', radio: 'TAC-2 (462.575 MHz)', rank: 'Senior Security Officer', phone: '+1 (555) 019-8041' },
    { id: 'OFF-712', name: 'Officer Elena Rostova', badge: 'SEC-712', radio: 'TAC-1 (462.550 MHz)', rank: 'Special Escort Supervisor', phone: '+1 (555) 019-7123' },
    { id: 'OFF-931', name: 'Officer David Kalu', badge: 'SEC-931', radio: 'TAC-3 (462.600 MHz)', rank: 'Datacenter Custodian', phone: '+1 (555) 019-9310' },
    { id: 'OFF-645', name: 'Officer Sarah Chen', badge: 'SEC-645', radio: 'TAC-2 (462.575 MHz)', rank: 'Vault Security Specialist', phone: '+1 (555) 019-6458' }
];

// ── SAMPLE VERIFIED ACTIVE VISITORS FOR RESTRICTED ACCESS ──
const SAMPLE_VISITORS = [
    {
        id: 101,
        userId: 'USR-78201-DEV',
        name: 'Dr. Evelyn Sterling',
        company: 'Quantum Microelectronics Corp',
        role: 'Lead Systems Architect & Auditor',
        id_number: 'PASS-89214-GB',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        phone: '+1 (555) 839-2041',
        email: 'evelyn.sterling@quantummicro.io',
        host_name: 'Dr. Alexander Hayes',
        department: 'Datacenter Infrastructure',
        ref_code: 'APT-DATACENTER-902',
        defaultZone: 'ZONE-A',
        access_level: 'LEVEL 4: RESTRICTED'
    },
    {
        id: 102,
        userId: 'USR-55209-SE',
        name: 'Henrik Lindqvist',
        company: 'Nordic Fire & SCADA Protection',
        role: 'Industrial Safety Inspector',
        id_number: 'GOV-55209-SE',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        phone: '+1 (555) 441-9823',
        email: 'h.lindqvist@nordicsafety.com',
        host_name: 'Marcus Vance (SOC)',
        department: 'Facilities & Power Systems',
        ref_code: 'APT-SCADA-418',
        defaultZone: 'ZONE-E',
        access_level: 'LEVEL 4: RESTRICTED'
    },
    {
        id: 103,
        userId: 'USR-33921-AE',
        name: 'Amina Al-Mansoor',
        company: 'Global Sovereign Capital Audit',
        role: 'External Reserve Custodian',
        id_number: 'DIPL-33921-AE',
        photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        phone: '+1 (555) 778-9102',
        email: 'amina.almansoor@gsc-audit.org',
        host_name: 'Victoria Stone (CFO)',
        department: 'Treasury & Executive Board',
        ref_code: 'APT-VAULT-770',
        defaultZone: 'ZONE-B',
        access_level: 'LEVEL 5: MAXIMUM CLEARANCE'
    },
    {
        id: 104,
        userId: 'USR-99142-USA',
        name: 'Capt. Jonathan Reyes',
        company: 'Federal Defense Logistics',
        role: 'Cybersecurity Verification Lead',
        id_number: 'MIL-99142-USA',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        phone: '+1 (555) 301-4478',
        email: 'j.reyes@cyberops.fed.gov',
        host_name: 'Col. Raymond Shaw (CISO)',
        department: 'Security Operations Center',
        ref_code: 'APT-SEC-109',
        defaultZone: 'ZONE-C',
        access_level: 'LEVEL 4: RESTRICTED'
    }
];

export default function BadgeManagement() {
    const { notify } = useNotification();
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    // Organization Branding
    const { organization, logoUrl: orgLogoUrl, orgName: organizationName } = useOrganization();
    const companyLogo = orgLogoUrl || organization?.logoUrl || '/logo.png';
    const companyName = organizationName || organization?.name || 'VMS ENTERPRISE SECURITY';

    // ── Data State ──
    const [arrivalsList, setArrivalsList] = useState([]);
    const [loadingArrivals, setLoadingArrivals] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState(SAMPLE_VISITORS[0]);
    const [selectedZone, setSelectedZone] = useState(RESTRICTED_ZONES[0]);
    const [assignedEscort, setAssignedEscort] = useState(ESCORT_OFFICERS[0]);
    
    // ── Mode Toggle: Restricted Area Badges vs Access Level Badges ──
    const [badgeSystemMode, setBadgeSystemMode] = useState('restricted'); // 'restricted' | 'access_level'

    // ── Access Level Clearance State ──
    const [selectedLevelId, setSelectedLevelId] = useState('LEVEL_3');
    const [selectedAccessZones, setSelectedAccessZones] = useState(ACCESS_LEVELS[2].defaultZones);
    const activeClearanceLevel = ACCESS_LEVELS.find(l => l.id === selectedLevelId) || ACCESS_LEVELS[2];

    const handleLevelSelect = (levelId) => {
        setSelectedLevelId(levelId);
        const lvl = ACCESS_LEVELS.find(l => l.id === levelId);
        if (lvl) {
            setSelectedAccessZones(lvl.defaultZones);
        }
    };

    const toggleAccessZone = (zone) => {
        setSelectedAccessZones(prev => 
            prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
        );
    };

    // ── Badge Configuration State ──
    const [clearanceTier, setClearanceTier] = useState(RESTRICTED_ZONES[0].level);
    const [validityHours, setValidityHours] = useState('8');
    const [escortRequired, setEscortRequired] = useState(true);
    const [customSpecialNotes, setCustomSpecialNotes] = useState('Escort officer must remain within visual line of sight at all times. Photography and detachable flash media prohibited.');
    const [badgeTheme, setBadgeTheme] = useState('crimson'); // crimson, gold, cyan, navy, hazard, emerald, purple, custom
    const [customColor, setCustomColor] = useState('#dc2626');
    const [badgeFillStyle, setBadgeFillStyle] = useState('vibrant'); // 'vibrant' | 'solid' | 'ambient'
    const [cardSide, setCardSide] = useState('front'); // 'front' | 'back'
    
    // ── Issued Passes Registry ──
    const [issuedBadges, setIssuedBadges] = useState([
        {
            badgeId: 'BADGE-REST-9402',
            badgeType: 'RESTRICTED',
            userId: 'USR-78201-DEV',
            visitorName: 'Dr. Evelyn Sterling',
            company: 'Quantum Microelectronics',
            photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
            zoneCode: 'ZONE 01: DATACENTER',
            level: 'LEVEL 4: RESTRICTED',
            escort: 'Officer Marcus Vance (#804)',
            issuedAt: '08:30 AM',
            expiresAt: '04:30 PM',
            status: 'ACTIVE',
            rfidUid: 'E4:9B:31:8F:A2:C0'
        },
        {
            badgeId: 'CLR-LEVEL3-8821',
            badgeType: 'ACCESS_LEVEL',
            userId: 'USR-33921-AE',
            visitorName: 'Amina Al-Mansoor',
            company: 'Global Sovereign Capital',
            photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
            zoneCode: 'Zone 1, Zone 2, Zone 3',
            level: 'EXECUTIVE WING',
            escort: 'Self-Escorted',
            issuedAt: '09:15 AM',
            expiresAt: '09:15 PM',
            status: 'ACTIVE',
            rfidUid: 'C1:33:AA:77:99:EE'
        },
        {
            badgeId: 'BADGE-REST-9398',
            badgeType: 'RESTRICTED',
            userId: 'USR-55209-SE',
            visitorName: 'Henrik Lindqvist',
            company: 'Nordic Fire & SCADA Protection',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            zoneCode: 'ZONE 05: SCADA SUBSTATION',
            level: 'LEVEL 4: RESTRICTED',
            escort: 'Officer Elena Rostova (#712)',
            issuedAt: '07:45 AM',
            expiresAt: '03:45 PM',
            status: 'ACTIVE',
            rfidUid: '8D:4F:19:62:3B:AA'
        },
        {
            badgeId: 'CLR-LEVEL6-1002',
            badgeType: 'ACCESS_LEVEL',
            userId: 'USR-99142-USA',
            visitorName: 'Capt. Jonathan Reyes',
            company: 'Federal Defense Logistics',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
            zoneCode: 'All 5 Facility Zones Active',
            level: 'VIP ALL-ACCESS MASTER',
            escort: 'Self-Escorted',
            issuedAt: '10:00 AM',
            expiresAt: '10:00 PM',
            status: 'ACTIVE',
            rfidUid: '3A:89:12:DF:CC:01'
        }
    ]);

    // ── Interactive UI Modals & Feedback ──
    const [showScanModal, setShowScanModal] = useState(false);
    const [showRfidModal, setShowRfidModal] = useState(false);
    const [rfidStatus, setRfidStatus] = useState('IDLE'); // IDLE, SCANNING, GRANTED, DENIED
    const [copySuccess, setCopySuccess] = useState(false);
    const [isIssuing, setIsIssuing] = useState(false);
    const [successBanner, setSuccessBanner] = useState(null);
    const [searchUserId, setSearchUserId] = useState('');
    const [searchFeedback, setSearchFeedback] = useState(null);

    const printableCardRef = useRef(null);

    // Dynamic Badge Number & Secure Token Generator
    const currentBadgeNumber = badgeSystemMode === 'restricted'
        ? `BADGE-REST-${selectedVisitor ? String(selectedVisitor.id).padStart(4, '0') : '9405'}`
        : `CLR-${activeClearanceLevel.id}-${selectedVisitor ? String(selectedVisitor.id).padStart(4, '0') : '8820'}`;
    const visitorUserId = selectedVisitor?.userId || selectedVisitor?.user_id || (selectedVisitor?.id ? (String(selectedVisitor.id).startsWith('USR') || String(selectedVisitor.id).startsWith('PASS') ? selectedVisitor.id : `USR-${String(selectedVisitor.id).padStart(4, '0')}`) : 'USR-0101');
    const dynamicQrToken = badgeSystemMode === 'restricted'
        ? `RESTRICTED|${currentBadgeNumber}|UID:${visitorUserId}|${selectedZone.id}|${selectedVisitor?.name || 'VISITOR'}|${selectedZone.level}|ESCORT:${assignedEscort.badge}|EXP:${validityHours}H`
        : `ACCESS_LEVEL|${currentBadgeNumber}|UID:${visitorUserId}|${activeClearanceLevel.shortName}|${selectedVisitor?.name || 'VISITOR'}|ZONES:${selectedAccessZones.length}|EXP:${validityHours}H`;
    const rfidSimulatedUid = `04:${(selectedVisitor?.id || 101).toString(16).padStart(2, '0')}:A9:7F:C2:5E`;

    // Access Level pass codes and QR url
    const activePassCode = selectedVisitor?.ref_code || selectedVisitor?.id_number || (selectedVisitor ? `VP-${selectedVisitor.id}` : 'VP-88102');
    const activeQrToken = selectedVisitor?.qr_token || `QR-${activePassCode}-${visitorUserId}`;
    const qrVerificationUrl = `${window.location.origin}/verify-pass?code=${encodeURIComponent(activePassCode)}&token=${encodeURIComponent(activeQrToken)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&data=${encodeURIComponent(qrVerificationUrl)}`;

    // Grant Access Level Handler
    const handleGrantAccessLevel = async () => {
        if (!selectedVisitor) return;
        setIsIssuing(true);
        try {
            const payload = {
                appointment_id: selectedVisitor.appointment_id || selectedVisitor.id,
                visitor_id: selectedVisitor.visitor_id || selectedVisitor.id,
                access_level: activeClearanceLevel.name,
                allowed_zones: selectedAccessZones,
                validity_hours: parseInt(validityHours, 10) || 12,
                escort_required: escortRequired,
                notes: 'Issued via Area & Access Level Badges Studio'
            };
            try {
                await api.post('/security/access-control/grant', payload);
            } catch (err) {
                console.warn('Backend access control fallback:', err);
            }

            const now = new Date();
            const exp = new Date(now.getTime() + (parseInt(validityHours, 10) || 12) * 60 * 60 * 1000);
            const newRecord = {
                badgeId: currentBadgeNumber,
                badgeType: 'ACCESS_LEVEL',
                userId: visitorUserId,
                visitorName: selectedVisitor.name || 'Official Guest',
                company: selectedVisitor.company || 'Enterprise Partner',
                photo: selectedVisitor.photo,
                zoneCode: selectedAccessZones.length === ALL_AVAILABLE_ZONES.length 
                    ? 'All 5 Facility Zones Active' 
                    : `${selectedAccessZones.length} Zones Active (${selectedAccessZones.map(z => z.split(':')[0]).join(', ')})`,
                level: activeClearanceLevel.shortName,
                escort: escortRequired ? 'Mandatory Escort' : 'Self-Escorted',
                issuedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                expiresAt: exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'ACTIVE',
                rfidUid: rfidSimulatedUid
            };

            setIssuedBadges(prev => [newRecord, ...prev.filter(b => b.badgeId !== newRecord.badgeId)]);
            const msg = `Access Clearance "${activeClearanceLevel.shortName}" granted and official badge generated for ${selectedVisitor.name}!`;
            setSuccessBanner(msg);
            notify.success(msg);
            setTimeout(() => setSuccessBanner(null), 6000);
        } finally {
            setIsIssuing(false);
        }
    };

    // Revoke Access Level Handler
    const handleRevokeAccessLevel = async () => {
        if (!selectedVisitor) return;
        setIsIssuing(true);
        try {
            try {
                await api.post('/security/access-control/revoke', {
                    appointment_id: selectedVisitor.appointment_id || selectedVisitor.id,
                    visitor_id: selectedVisitor.visitor_id || selectedVisitor.id,
                    reason: 'Revoked by Checkpoint Security Officer'
                });
            } catch (err) {
                console.warn('Backend revoke fallback:', err);
            }

            setIssuedBadges(prev => prev.map(b => 
                (b.visitorName === selectedVisitor.name || b.userId === visitorUserId)
                    ? { ...b, status: 'REVOKED' }
                    : b
            ));
            const msg = `Security clearance and building access REVOKED for ${selectedVisitor.name}.`;
            setSuccessBanner(msg);
            notify.warning(msg);
            setTimeout(() => setSuccessBanner(null), 6000);
        } finally {
            setIsIssuing(false);
        }
    };

    // Fetch live visitors from database on mount
    useEffect(() => {
        fetchRealDatabaseArrivals();
    }, []);

    // Check URL parameters for pre-selected visitor
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const visParam = params.get('visitorId') || params.get('search');
        if (visParam && arrivalsList.length > 0) {
            const found = arrivalsList.find(a => String(a.id) === String(visParam) || a.name?.toLowerCase().includes(visParam.toLowerCase()));
            if (found) {
                setSelectedVisitor(found);
            }
        }
    }, [arrivalsList]);

    const fetchRealDatabaseArrivals = async () => {
        setLoadingArrivals(true);
        try {
            const res = await api.get('/reception/arrivals?filter=ALL');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            if (data.length > 0) {
                const mapped = data.map(arr => ({
                    id: arr.visitor_id || arr.id,
                    name: arr.visitor_name || 'Guest Visitor',
                    company: arr.visitor_company || arr.company || 'Enterprise Partner',
                    role: arr.purpose || 'Official Restricted Access',
                    id_number: arr.id_number || `VIS-${arr.visitor_id || arr.id}`,
                    photo: resolvePhotoUrl(arr.visitor_photo),
                    phone: arr.visitor_phone || arr.phone || '+1 (555) 000-0000',
                    email: arr.visitor_email || arr.email || 'visitor@enterprise.com',
                    host_name: arr.host_name || 'Facility Security Staff',
                    department: arr.department_name || 'Security Operations',
                    ref_code: arr.appointment_number || arr.reference_code || `APT-${arr.id}`,
                    defaultZone: 'ZONE-A',
                    access_level: 'LEVEL 4: RESTRICTED'
                }));
                // Combine with high-security samples if small
                const combined = [...mapped, ...SAMPLE_VISITORS.filter(s => !mapped.some(m => m.id === s.id))];
                setArrivalsList(combined);
                if (combined.length > 0) setSelectedVisitor(combined[0]);
            } else {
                setArrivalsList(SAMPLE_VISITORS);
                setSelectedVisitor(SAMPLE_VISITORS[0]);
            }
        } catch (err) {
            console.warn('Using certified sample profiles for Restricted Badge Studio:', err);
            setArrivalsList(SAMPLE_VISITORS);
            setSelectedVisitor(SAMPLE_VISITORS[0]);
        } finally {
            setLoadingArrivals(false);
        }
    };

    // Search visitor by User ID, Gov ID number, or Ref code
    const handleSearchVisitor = (e) => {
        if (e) e.preventDefault();
        const term = searchUserId.trim().toLowerCase();
        if (!term) {
            const msg = 'Please enter a User ID, Gov ID, or Reference Code.';
            setSearchFeedback({ type: 'error', message: msg });
            notify.warning(msg);
            return;
        }

        const found = arrivalsList.find(a => 
            String(a.id).toLowerCase() === term ||
            String(a.id_number || '').toLowerCase().includes(term) ||
            String(a.ref_code || '').toLowerCase().includes(term) ||
            String(a.name || '').toLowerCase().includes(term)
        );

        if (found) {
            setSelectedVisitor(found);
            const msg = `Visitor profile loaded: ${found.name}`;
            setSearchFeedback({ type: 'success', message: msg });
            notify.success(msg);
            setTimeout(() => setSearchFeedback(null), 3000);
        } else {
            const msg = `No visitor found with ID "${searchUserId.trim()}". Check ID number.`;
            setSearchFeedback({ type: 'error', message: msg });
            notify.error(msg);
        }
    };

    // Clear currently selected visitor profile
    const handleClearVisitor = () => {
        setSelectedVisitor(null);
        setSearchUserId('');
        setSearchFeedback(null);
    };

    // When Zone Changes, sync theme and clearance
    const handleZoneChange = (zone) => {
        setSelectedZone(zone);
        setClearanceTier(zone.level);
        setBadgeTheme(zone.theme);
        if (zone.badgeColor) {
            setCustomColor(zone.badgeColor);
        }
        if (zone.escortRequired) {
            setEscortRequired(true);
        }
    };

    // Audio synthesizer for authentic electronic reader chime
    const playReaderChime = (granted = true) => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (granted) {
                // High-pitched pleasant dual-tone chime
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08); // E6
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.35);
            } else {
                // Low-pitched warning double buzz
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            }
        } catch (e) {
            // Audio context not allowed or unsupported
        }
    };

    // Simulate RFID Turnstile Tap
    const triggerRfidSimulation = () => {
        setShowRfidModal(true);
        setRfidStatus('SCANNING');
        setTimeout(() => {
            setRfidStatus('GRANTED');
            playReaderChime(true);
        }, 1200);
    };

    // Issue / Activate Badge
    const handleIssueBadge = () => {
        setIsIssuing(true);
        setTimeout(() => {
            setIsIssuing(false);
            const now = new Date();
            const exp = new Date(now.getTime() + parseInt(validityHours) * 60 * 60 * 1000);
            
            const newBadge = {
                badgeId: currentBadgeNumber,
                userId: visitorUserId,
                visitorName: selectedVisitor?.name || 'Official Visitor',
                company: selectedVisitor?.company || 'Authorized Contractor',
                photo: selectedVisitor?.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
                zoneCode: selectedZone.code,
                level: clearanceTier,
                escort: escortRequired ? `${assignedEscort.name} (${assignedEscort.badge})` : 'Self-Guided (Escort Exempt)',
                issuedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                expiresAt: exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'ACTIVE',
                rfidUid: rfidSimulatedUid
            };

            setIssuedBadges(prev => [newBadge, ...prev.filter(b => b.badgeId !== newBadge.badgeId)]);
            const msg = `Restricted Badge ${currentBadgeNumber} successfully provisioned and authorized for ${selectedZone.code}.`;
            setSuccessBanner(msg);
            notify.success(msg);
            setTimeout(() => setSuccessBanner(null), 6000);
        }, 800);
    };

    // Print Badge
    const handlePrintBadge = () => {
        window.print();
    };

    // Copy Pass Token
    const handleCopyPassToken = () => {
        navigator.clipboard.writeText(dynamicQrToken);
        setCopySuccess(true);
        notify.info('Pass verification token copied to clipboard.');
        setTimeout(() => setCopySuccess(false), 2500);
    };

    // Theme style resolvers
    const getThemePillClasses = (theme) => {
        switch (theme) {
            case 'crimson':
                return 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-900/40 border border-red-500/60';
            case 'gold':
                return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-900/40 border border-amber-400 font-black';
            case 'cyan':
                return 'bg-gradient-to-r from-cyan-600 to-teal-700 text-white shadow-lg shadow-cyan-900/40 border border-cyan-400/60';
            case 'hazard':
                return 'bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-lg shadow-orange-900/40 border border-orange-500/60';
            case 'emerald':
                return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/40 border border-emerald-500/60';
            case 'purple':
                return 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-900/40 border border-purple-500/60';
            case 'custom':
                return 'text-white border border-white/20';
            case 'navy':
            default:
                return 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-900/40 border border-blue-400/60';
        }
    };

    const getThemeBorderClasses = (theme) => {
        switch (theme) {
            case 'crimson': return 'border-red-600/70 shadow-red-600/20';
            case 'gold': return 'border-amber-500/70 shadow-amber-500/20';
            case 'cyan': return 'border-cyan-500/70 shadow-cyan-500/20';
            case 'hazard': return 'border-orange-500/70 shadow-orange-500/20';
            case 'emerald': return 'border-emerald-500/70 shadow-emerald-500/20';
            case 'purple': return 'border-purple-500/70 shadow-purple-500/20';
            case 'custom': return 'border-slate-700';
            case 'navy':
            default: return 'border-blue-600/70 shadow-blue-600/20';
        }
    };

    // Active card color: Uses selected clearance level color in access_level mode, customColor in restricted mode
    const activeBadgeColor = badgeSystemMode === 'access_level'
        ? (activeClearanceLevel.hexColor || '#dc2626')
        : customColor;

    // Dynamic background fill generator based on active color and fill style
    const getBadgeSurfaceBackground = (color = activeBadgeColor) => {
        if (badgeFillStyle === 'solid') {
            return `linear-gradient(160deg, ${color} 0%, ${color} 100%)`;
        }
        if (badgeFillStyle === 'ambient') {
            return `linear-gradient(170deg, ${color}70 0%, ${color}30 35%, #080d1e 80%, #040816 100%)`;
        }
        // 'vibrant' default (rich, radiant full-card fill using active color)
        return `linear-gradient(160deg, ${color} 0%, ${color}f0 45%, ${color}cc 100%)`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6">
            
            {/* ══════════════════════════════════════════════════════════════════
                PRINT STYLES: PERFECT ISO CR-80 SPECIFICATION FOR PVC CARD PRINTERS
                ══════════════════════════════════════════════════════════════════ */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    header, nav, aside, .print\\:hidden, button, .vms-drawer-open {
                        display: none !important;
                    }
                    .print-badge-container {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        min-height: 100vh !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-card-surface {
                        width: 320px !important;
                        max-width: 320px !important;
                        border: 2px solid #000 !important;
                        box-shadow: none !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin: 15px auto !important;
                        border-radius: 16px !important;
                        background: #0a1128 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-card-back {
                        width: 320px !important;
                        max-width: 320px !important;
                        border: 2px solid #000 !important;
                        box-shadow: none !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin: 20px auto !important;
                        border-radius: 16px !important;
                        background: #0f172a !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}} />

            {/* ══════════════════════════════════════════════════════════════════
                PAGE HEADER & BADGE SYSTEM MODE TOGGLE (RESTRICTED vs ACCESS LEVEL)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <BackButton />
                        <div className={`p-2.5 rounded-2xl border shadow-lg transition-all ${
                            badgeSystemMode === 'restricted'
                                ? 'bg-red-600/15 border-red-500/30 text-red-400 shadow-red-600/10'
                                : 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400 shadow-indigo-600/10'
                        }`}>
                            {badgeSystemMode === 'restricted' ? <ShieldAlert className="w-7 h-7" /> : <Key className="w-7 h-7" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                                    {isAm ? 'የቦታ እና የመዳረሻ ደረጃ ባጅ ማዕከል' : 'Area & Access Level Badges Studio'}
                                </h1>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isAm 
                                    ? 'የተከለከሉ ዞኖች እና የደህንነት መዳረሻ ደረጃ ባጆችን ያዘጋጁ፣ ያትሙ እና ያረጋግጡ' 
                                    : 'Issue, configure, print, and audit both Perimeter Restricted Badges and Clearance Level Badges.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Top Actions & Badge Mode Switcher */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* High-Contrast Segmented Mode Switcher */}
                    <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
                        <button
                            type="button"
                            onClick={() => setBadgeSystemMode('restricted')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                badgeSystemMode === 'restricted'
                                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/40 border border-red-500/40'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Restricted Area Badge</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setBadgeSystemMode('access_level')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                badgeSystemMode === 'access_level'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40 border border-indigo-500/40'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span>Access Level Badge</span>
                        </button>
                    </div>

                    <button
                        onClick={fetchRealDatabaseArrivals}
                        disabled={loadingArrivals}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingArrivals ? 'animate-spin text-blue-400' : ''}`} />
                        <span>{isAm ? 'ጎብኝዎችን አድስ' : 'Sync Arrivals'}</span>
                    </button>
                </div>
            </div>

            {/* SUCCESS BANNER ALERT */}
            {successBanner && (
                <div className="print:hidden p-4 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl flex items-center justify-between text-emerald-200 text-xs font-semibold shadow-xl shadow-emerald-950/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-white block uppercase tracking-wider text-[11px]">Credential Authorized</span>
                            <span>{successBanner}</span>
                        </div>
                    </div>
                    <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MAIN STUDIO GRID: CONFIGURATION CONTROLS (LEFT) + 3D LANYARD BADGE (RIGHT)
                ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ──────────────────────────────────────────────────────────
                    LEFT COLUMN: RESTRICTED CREDENTIAL STUDIO FORM (PRINT HIDDEN)
                    ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-6 space-y-5 print:hidden">
                    
                    {/* STEP 1: VISITOR SELECTOR & PROFILE CARD */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        1. Target Visitor Profile
                                    </h3>
                                    <p className="text-[10px] text-slate-400">
                                        Select verified arrival or visitor requiring restricted perimeter access
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search by User ID / Gov ID Form */}
                        <form onSubmit={handleSearchVisitor} className="mb-3 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Search by User ID / Gov ID / Ref Code
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Enter User ID (e.g. PASS-89214-GB, 101, or name)..."
                                        value={searchUserId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSearchUserId(val);
                                            const query = val.trim().toLowerCase();
                                            if (query.length >= 2) {
                                                const match = arrivalsList.find(a => 
                                                    String(a.id).toLowerCase() === query ||
                                                    String(a.id_number || '').toLowerCase().includes(query) ||
                                                    String(a.ref_code || '').toLowerCase().includes(query) ||
                                                    String(a.name || '').toLowerCase().includes(query)
                                                );
                                                if (match) {
                                                    setSelectedVisitor(match);
                                                    setSearchFeedback(null);
                                                }
                                            }
                                        }}
                                        className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                                    />
                                    {searchUserId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchUserId('');
                                                setSearchFeedback(null);
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                    <span>Search</span>
                                </button>
                            </div>

                            {/* Search Feedback */}
                            {searchFeedback && (
                                <p className={`text-[10px] font-semibold flex items-center gap-1 px-1 ${
                                    searchFeedback.type === 'error' ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                    {searchFeedback.type === 'error' ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                    <span>{searchFeedback.message}</span>
                                </p>
                            )}
                        </form>

                        {/* Selected Visitor Active Card with Delete Icon */}
                        {selectedVisitor ? (
                            <div className="mt-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 relative group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border-2 border-red-500/40 shrink-0 shadow-md">
                                        <img 
                                            src={selectedVisitor.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'} 
                                            alt={selectedVisitor.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                                            }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-sm font-black text-white truncate">{selectedVisitor.name}</h4>
                                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 font-bold shrink-0">
                                                IDENTITY VERIFIED
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-400/90 font-medium truncate">{selectedVisitor.role} • {selectedVisitor.company}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono flex-wrap">
                                            <span>User ID: <strong className="text-cyan-400">{visitorUserId}</strong></span>
                                            <span>Gov ID: <strong className="text-slate-300">{selectedVisitor.id_number}</strong></span>
                                            <span>Ref: <strong className="text-slate-300">{selectedVisitor.ref_code}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Host Officer</span>
                                        <span className="text-xs font-semibold text-slate-200">{selectedVisitor.host_name}</span>
                                    </div>

                                    {/* Delete / Clear Visitor Profile Button */}
                                    <button
                                        type="button"
                                        onClick={handleClearVisitor}
                                        className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-400 hover:text-white transition-all cursor-pointer shadow group/del"
                                        title="Delete / Remove Selected Visitor"
                                    >
                                        <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl text-center space-y-1">
                                <p className="text-xs text-slate-400 font-medium">
                                    No visitor profile loaded. Search by User ID or Gov ID above.
                                </p>
                                <p className="text-[10px] text-slate-600 font-mono">
                                    Quick Search: PASS-89214-GB, USR-78201-DEV, Henrik, Elena
                                </p>
                            </div>
                        )}
                    </div>

                    {/* STEP 2 & 3: RESTRICTED ZONE PRESETS & ESCORT (ONLY IN RESTRICTED MODE) */}
                    {badgeSystemMode === 'restricted' ? (
                        <>
                            {/* STEP 2: AUTHORIZED RESTRICTED ZONE (COMPACT DROPDOWN) */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                                2. Authorized Restricted Zone
                                            </h3>
                                            <p className="text-[10px] text-slate-400">
                                                Perimeter zone classification & clearance tier
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getThemePillClasses(selectedZone.theme)}`}>
                                        {selectedZone.level}
                                    </span>
                                </div>

                                {/* Zone Dropdown Selector */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Restricted Zone Preset
                                    </label>
                                    <select
                                        value={selectedZone.id}
                                        onChange={(e) => {
                                            const z = RESTRICTED_ZONES.find(x => x.id === e.target.value);
                                            if (z) handleZoneChange(z);
                                        }}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
                                    >
                                        {RESTRICTED_ZONES.map(z => (
                                            <option key={z.id} value={z.id}>
                                                {z.code} — {z.title} ({z.level})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
                                        <span className="text-amber-400 font-medium truncate max-w-[200px]">{selectedZone.facility}</span>
                                        <span className="text-slate-500 font-mono">{selectedZone.allowedHours}</span>
                                    </div>
                                </div>

                                {/* Clearance Tier & Validity Window Inline Dropdowns */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                            Clearance Tier
                                        </label>
                                        <select
                                            value={clearanceTier}
                                            onChange={(e) => setClearanceTier(e.target.value)}
                                            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
                                        >
                                            <option value="LEVEL 3: CONFIDENTIAL">LEVEL 3: CONFIDENTIAL</option>
                                            <option value="LEVEL 4: RESTRICTED">LEVEL 4: RESTRICTED</option>
                                            <option value="LEVEL 5: MAXIMUM CLEARANCE">LEVEL 5: MAXIMUM CLEARANCE</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                            Validity Window
                                        </label>
                                        <select
                                            value={validityHours}
                                            onChange={(e) => setValidityHours(e.target.value)}
                                            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
                                        >
                                            <option value="2">2 Hours (Incident)</option>
                                            <option value="4">4 Hours (Half Shift)</option>
                                            <option value="8">8 Hours (Full Shift)</option>
                                            <option value="12">12 Hours (Maintenance)</option>
                                            <option value="24">24 Hours (Full Day)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 3: SECURITY ESCORT OFFICER (TOGGLE ON/OFF & DROPDOWN) */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                                            <Radio className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                                3. Security Escort Officer Pairing
                                            </h3>
                                            <p className="text-[10px] text-slate-400">
                                                1:1 officer accompaniment for restricted zone
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Toggle Escort ON/OFF */}
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={escortRequired}
                                            onChange={(e) => setEscortRequired(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 relative" />
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                            escortRequired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {escortRequired ? 'MANDATORY' : 'EXEMPT'}
                                        </span>
                                    </label>
                                </div>

                                {escortRequired ? (
                                    <div className="space-y-2.5">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                Assigned Escort Officer
                                            </label>
                                            <select
                                                value={assignedEscort.id}
                                                onChange={(e) => {
                                                    const off = ESCORT_OFFICERS.find(x => x.id === e.target.value);
                                                    if (off) setAssignedEscort(off);
                                                }}
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                                            >
                                                {ESCORT_OFFICERS.map(off => (
                                                    <option key={off.id} value={off.id}>
                                                        👮 {off.name} ({off.badge}) • Radio: {off.radio} — {off.rank}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-[10px] text-slate-400">
                                            <span className="font-mono text-cyan-400">Comms: {assignedEscort.radio}</span>
                                            <span className="text-slate-500 font-medium truncate max-w-[160px]">PPE: {selectedZone.ppeRequired}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Self-Guided Restricted Authorization — Escort Officer Exempt</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ACCESS LEVEL CLEARANCE CONFIGURATION (MATCHES UPLOADED SCREENSHOT) */
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
                            {/* Section Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <span className="text-[9px] font-mono font-black uppercase tracking-wider text-indigo-400 block">
                                        CHECKPOINT CONFIG
                                    </span>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                                        <Key className="w-4 h-4 text-amber-400" />
                                        <span>GRANT CLEARANCE LEVEL</span>
                                    </h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300">
                                    Target: <strong className="text-white">{selectedVisitor ? (selectedVisitor.role || selectedVisitor.name) : 'Guest'}</strong>
                                </span>
                            </div>

                            {/* 1. SELECT SECURITY CLEARANCE LEVEL: COMPACT DROPDOWN (SAVES LARGE SPACE) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-black uppercase text-slate-300 tracking-wider">
                                        1. Security Clearance Level:
                                    </label>
                                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                        {activeClearanceLevel.shortName}
                                    </span>
                                </div>

                                <div className="relative">
                                    <select
                                        value={selectedLevelId}
                                        onChange={(e) => handleLevelSelect(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm"
                                    >
                                        {ACCESS_LEVELS.map((lvl) => (
                                            <option key={lvl.id} value={lvl.id} className="bg-slate-900 text-white font-bold py-1.5">
                                                {lvl.name} ({lvl.shortName})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Compact Selected Level Summary Pill */}
                                <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-2.5 bg-slate-950/70 ${activeClearanceLevel.border} shadow-sm`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeClearanceLevel.dotColor} animate-pulse`} />
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-white block truncate">
                                                {activeClearanceLevel.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block truncate">
                                                {activeClearanceLevel.description}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 whitespace-nowrap shrink-0">
                                        {selectedAccessZones.length} Zones
                                    </span>
                                </div>
                            </div>

                            {/* 2. AUTHORIZED FACILITY ZONES: COMPACT 2-COLUMN GRID */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-black uppercase text-slate-300 tracking-wider">
                                        2. Authorized Facility Zones:
                                    </label>
                                    <span className="text-[10px] text-indigo-400 font-bold">{selectedAccessZones.length} / 5 Active</span>
                                </div>

                                <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {ALL_AVAILABLE_ZONES.map((zone) => {
                                        const isChecked = selectedAccessZones.includes(zone);
                                        return (
                                            <label
                                                key={zone}
                                                className={`flex items-center gap-2 p-2 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all border ${
                                                    isChecked 
                                                        ? 'bg-indigo-950/50 text-indigo-200 border-indigo-500/40 shadow-sm' 
                                                        : 'bg-slate-900/30 text-slate-400 border-slate-800/60 hover:border-slate-700'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleAccessZone(zone)}
                                                    className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer accent-indigo-500 shrink-0"
                                                />
                                                <span className="truncate">{zone}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PASS VALIDITY & ESCORT RULE */}
                            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                        PASS VALIDITY:
                                    </label>
                                    <select
                                        value={validityHours}
                                        onChange={(e) => setValidityHours(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-bold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                        <option value="4">4 Hours (Half Day)</option>
                                        <option value="8">8 Hours (Full Shift)</option>
                                        <option value="12">12 Hours (Standard)</option>
                                        <option value="24">24 Hours (Full Day)</option>
                                        <option value="72">72 Hours (3 Days)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                        ESCORT RULE:
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setEscortRequired(!escortRequired)}
                                        className={`w-full py-2 px-2.5 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                            escortRequired
                                                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>{escortRequired ? 'Escort Required' : 'Self-Escorted'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* ACTION BUTTONS (AUTHORIZE & REVOKE) */}
                            <div className="pt-2 space-y-2">
                                <button
                                    type="button"
                                    disabled={isIssuing || !selectedVisitor}
                                    onClick={handleGrantAccessLevel}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 border border-indigo-500/40 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isIssuing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                            <span>Processing Security Clearance...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4 text-white" />
                                            <span>Authorize & Issue Security Clearance</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    disabled={isIssuing || !selectedVisitor}
                                    onClick={handleRevokeAccessLevel}
                                    className="w-full py-2.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Revoke / Block Access</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ──────────────────────────────────────────────────────────
                    RIGHT COLUMN: DUAL-MODE BADGE VISUALIZER (RESTRICTED vs ACCESS LEVEL)
                    ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                    {badgeSystemMode === 'restricted' ? (
                        <>
                            {/* Action Bar Above Badge Card */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] flex items-center justify-between mb-3 text-xs font-semibold px-1 print:hidden">
                        
                        <div className="flex items-center gap-1.5">
                            {/* Toggle Front / Back Button */}
                            <button
                                type="button"
                                onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Flip Badge to view Front or Back side"
                            >
                                <RotateCcw className="w-3 h-3 text-cyan-400" />
                                <span>{cardSide === 'front' ? 'Flip to Back' : 'Flip to Front'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowScanModal(true)}
                                className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Scan className="w-3 h-3 text-emerald-400" />
                                <span>Verify QR</span>
                            </button>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        ULTRA-REALISTIC 3D LANYARD BADGE (PRINT-OPTIMIZED)
                        ══════════════════════════════════════════════════════════════════ */}
                    <div ref={printableCardRef} className="print-badge-container w-full max-w-[340px] sm:max-w-[360px] flex flex-col items-center select-none">
                        
                        {/* 1. LANYARD STRAP: HIGH-VISIBILITY HEAVY-DUTY WEAVE */}
                        <div className="w-14 h-16 sm:h-20 relative overflow-hidden flex flex-col items-center shadow-lg print:hidden">
                            <div 
                                style={{
                                    background: `linear-gradient(180deg, #18181b 0%, ${customColor}cc 50%, #18181b 100%)`,
                                    borderColor: `${customColor}80`
                                }}
                                className="w-full h-full border-x relative flex items-center justify-center transition-all duration-300"
                            >
                                {/* Diagonal Security Hazard Micro-Texture */}
                                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_5px,#fff_5px,#fff_10px)]" />
                                <div className="absolute inset-y-0 left-1 w-0.5 border-r border-dotted border-white/20" />
                                <div className="absolute inset-y-0 right-1 w-0.5 border-l border-dotted border-white/20" />
                                <span className="text-[7px] font-black text-white tracking-widest uppercase rotate-90 whitespace-nowrap drop-shadow">
                                    RESTRICTED ACCESS
                                </span>
                            </div>
                        </div>

                        {/* 2. CHROME METALLIC SWIVEL LOBSTER CLAMP / CLIP */}
                        <div className="flex flex-col items-center -mt-1 z-20 print:hidden">
                            <div className="w-9 h-2.5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-sm shadow-sm border border-slate-300" />
                            <div className="w-4 h-3 rounded-full border-2 border-slate-300 bg-gradient-to-b from-slate-200 to-slate-400 -mt-0.5 shadow" />
                            <div className="w-6 h-7 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 rounded-b-xl border border-slate-300 shadow-md relative -mt-0.5 flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-slate-600 rounded-full absolute -right-0.5 top-1" />
                                <div className="w-2.5 h-4 rounded-full border border-slate-400/80 bg-slate-900/40" />
                            </div>
                        </div>

                        {/* 3. FROSTED CLEAR ACRYLIC BADGE HOLDER / SLEEVE */}
                        <div className="w-full bg-slate-900/50 backdrop-blur-md border-2 border-slate-700/80 rounded-[28px] p-2.5 sm:p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative -mt-2 z-10 print:bg-white print:border-none print:shadow-none print:p-0">
                            
                            {/* Acrylic Holder Punch Hole Slots */}
                            <div className="flex items-center justify-center gap-2 mb-2 print:hidden">
                                <div className="w-6 h-1.5 bg-slate-950/80 rounded-full border border-slate-700/60" />
                                <div className="w-14 h-3 bg-slate-950/90 rounded-full border border-slate-600/80 flex items-center justify-center shadow-inner">
                                    <div className="w-2 h-2 rounded-full bg-slate-400/40" />
                                </div>
                                <div className="w-6 h-1.5 bg-slate-950/80 rounded-full border border-slate-700/60" />
                            </div>

                            {/* ══════════════════════════════════════════════════════════
                                4. FRONT FACE OF THE RESTRICTED CARD
                                ══════════════════════════════════════════════════════════ */}
                            {cardSide === 'front' ? (
                                <div 
                                    style={{
                                        background: getBadgeSurfaceBackground(),
                                        borderColor: customColor,
                                        boxShadow: `0 20px 50px -10px ${customColor}55, 0 0 35px ${customColor}35`
                                    }}
                                    className="print-card-surface w-full rounded-[22px] overflow-hidden border-2 text-white relative shadow-2xl flex flex-col justify-between transition-all duration-300"
                                >
                                    
                                    {/* Security Guilloché Background Geometric Waves */}
                                    <div className="absolute inset-0 pointer-events-none opacity-20">
                                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <pattern id="guillocheGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <circle cx="20" cy="20" r="18" fill="none" stroke={customColor} strokeWidth="0.5"/>
                                                    <circle cx="20" cy="20" r="12" fill="none" stroke="#ffffff" strokeWidth="0.4"/>
                                                    <path d="M0,20 Q10,0 20,20 T40,20" fill="none" stroke={customColor} strokeWidth="0.4"/>
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill="url(#guillocheGrid)" />
                                        </svg>
                                    </div>

                                    {/* TOP WARNING CLEARANCE HEADER BANNER */}
                                    <div 
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.60) 100%)',
                                            borderBottom: '1px solid rgba(255,255,255,0.25)',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                        }}
                                        className="pt-3.5 pb-2.5 px-3 flex flex-col items-center text-center relative z-10"
                                    >
                                        <div className="flex items-center justify-between w-full px-1">
                                            <div className="flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5 text-white/90" />
                                                <span className="text-[9px] font-black tracking-widest uppercase text-white drop-shadow">
                                                    RESTRICTED AREA ACCESS
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-white border border-white/20">
                                                ID-1 / CR80
                                            </span>
                                        </div>

                                        <h3 className="text-[13px] font-black uppercase tracking-wider text-white mt-1 leading-tight drop-shadow-md">
                                            {selectedZone.code}
                                        </h3>
                                        <span className="text-[8px] font-mono tracking-widest text-white/95 mt-0.5 font-bold uppercase drop-shadow-sm">
                                            {clearanceTier}
                                        </span>
                                    </div>

                                    {/* COMPANY LOGO & OFFICIAL SUBTITLE */}
                                    <div className="px-4 pt-2.5 pb-1 flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shadow border border-slate-700 shrink-0">
                                                <img 
                                                    src={companyLogo} 
                                                    alt="Logo" 
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/logo.png';
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[170px]">
                                                    {companyName}
                                                </h4>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block -mt-0.5">
                                                    Facility Access Credential
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contactless RFID / MIFARE Smart Chip Icon */}
                                        <div className="flex flex-col items-end text-cyan-400" title="Contactless MIFARE DESFire EV3 RFID Chip Encoded">
                                            <div className="flex items-center gap-1">
                                                <Wifi className="w-3.5 h-3.5 rotate-90" />
                                                <span className="text-[8px] font-mono font-bold">RFID</span>
                                            </div>
                                            <span className="text-[7px] font-mono text-slate-500">13.56 MHz</span>
                                        </div>
                                    </div>

                                    {/* VISITOR PORTRAIT PHOTO WITH HOLOGRAPHIC SECURITY CORNERS */}
                                    <div className="relative my-2.5 flex items-center justify-center">
                                        
                                        {/* Security Corner Reticles */}
                                        <div className="relative p-1">
                                            {/* Photo Frame Container */}
                                            <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-[0_0_25px_rgba(0,0,0,0.8)] flex items-center justify-center">
                                                <img 
                                                    src={selectedVisitor?.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'} 
                                                    alt={selectedVisitor?.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                                                    }}
                                                />

                                                {/* Biometric Mesh Overlay Effect */}
                                                <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay pointer-events-none" />
                                                
                                                {/* Official Red Authorization Stamp Overlay */}
                                                <div 
                                                    style={{ backgroundColor: customColor }}
                                                    className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white rounded text-[8px] font-black uppercase tracking-widest border border-white/40 shadow rotate-[-6deg]"
                                                >
                                                    AUTHORIZED
                                                </div>
                                            </div>

                                            {/* Holographic Security Foil Watermark Badge */}
                                            <div className="absolute -top-2 -right-2 z-20 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-cyan-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center animate-pulse">
                                                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-[7px] font-black text-amber-300 uppercase leading-none text-center">
                                                    <Sparkles className="w-2.5 h-2.5 text-amber-300 mb-0.5" />
                                                    <span>SEAL</span>
                                                </div>
                                            </div>

                                            {/* Corner Reticle Brackets */}
                                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: customColor }} />
                                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: customColor }} />
                                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: customColor }} />
                                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: customColor }} />
                                        </div>
                                    </div>

                                    {/* VISITOR FULL NAME & CREDENTIALS */}
                                    <div className="text-center px-4 pt-0.5 pb-2 relative z-10">
                                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-sm truncate">
                                            {selectedVisitor?.name || 'Authorized Visitor'}
                                        </h2>
                                        <div className="flex items-center justify-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-bold text-amber-400 tracking-wide truncate max-w-[190px]">
                                                {selectedVisitor?.company || 'Authorized Contractor'}
                                            </span>
                                            <span className="text-[8px] font-mono font-bold text-cyan-300 bg-black/45 px-1.5 py-0.5 rounded border border-cyan-500/40">
                                                ID: {visitorUserId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* KEY-VALUE SECURITY CREDENTIAL TABLE */}
                                    <div className="mx-3 my-1 px-4 py-2 relative z-10 text-[10px] space-y-1 bg-black/45 backdrop-blur-md rounded-xl border border-white/25 shadow-sm">
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Badge ID</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono font-black text-amber-300 tracking-wider truncate drop-shadow">{currentBadgeNumber}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">User ID</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono font-black text-cyan-300 tracking-wider truncate drop-shadow-sm">{visitorUserId}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Govt ID / Ref</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono font-bold text-white tracking-wider truncate">{selectedVisitor?.id_number}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Escort Officer</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-bold text-emerald-300 truncate">
                                                {escortRequired ? `${assignedEscort.name} (${assignedEscort.badge})` : 'Exempt'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Radio Channel</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono text-cyan-200 font-bold truncate text-[9px]">
                                                {assignedEscort.radio}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Valid Window</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 text-yellow-200 font-bold truncate text-[9px]">
                                                {validityHours} Hours (Single Shift)
                                            </span>
                                        </div>
                                    </div>

                                    {/* MANDATORY ESCORT HIGH-VISIBILITY WARNING STRIP */}
                                    {escortRequired && (
                                        <div className="mx-3 my-1 px-3 py-1 bg-black/55 backdrop-blur-md text-white text-center text-[9px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 rounded-lg border border-white/20 shadow-inner">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                            <span className="drop-shadow-sm">SECURITY ESCORT MANDATORY AT ALL TIMES</span>
                                        </div>
                                    )}

                                    {/* BARCODE & OPTICAL QR SECTION */}
                                    <div className="py-2.5 px-3 bg-white text-slate-900 text-center flex flex-col items-center justify-center relative">
                                        
                                        {/* Realistic Optical Barcode Stripes */}
                                        <div className="w-full flex items-center justify-between px-2 h-7 overflow-hidden">
                                            {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,4,1,2,1,3,2,1].map((w, i) => (
                                                <div 
                                                    key={i} 
                                                    style={{ width: `${w * 1.6}px` }} 
                                                    className={`h-full ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`} 
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between w-full px-2 text-[8px] font-mono font-black text-slate-800 tracking-wider mt-1">
                                            <span>{currentBadgeNumber}</span>
                                            <span className="text-blue-900 font-bold">{visitorUserId}</span>
                                            <span>{selectedZone.id}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ══════════════════════════════════════════════════════════
                                    BACK FACE OF THE RESTRICTED CARD (REGULATIONS & EVACUATION)
                                    ══════════════════════════════════════════════════════════ */
                                <div 
                                    style={{
                                        background: getBadgeSurfaceBackground(),
                                        borderColor: customColor,
                                        boxShadow: `0 20px 50px -10px ${customColor}55, 0 0 35px ${customColor}35`
                                    }}
                                    className="print-card-back w-full rounded-[22px] overflow-hidden border-2 text-white relative shadow-2xl flex flex-col justify-between transition-all duration-300 min-h-[460px]"
                                >
                                    
                                    {/* MAGNETIC STRIPE MOCKUP AT TOP OF CARD BACK */}
                                    <div className="w-full h-11 bg-black border-y border-slate-700/80 relative shadow-inner flex items-center justify-center">
                                        <span className="text-[7px] font-mono text-slate-600 tracking-widest uppercase">
                                            ENCODED MAGNETIC STRIPE • TRACK 1 & 2 SECURE
                                        </span>
                                    </div>

                                    {/* HAZARD WARNING CHEVRON HEADER */}
                                    <div 
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)',
                                            borderBottom: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                        className="p-3 flex items-center gap-2"
                                    >
                                        <AlertOctagon className="w-5 h-5 text-amber-300 shrink-0" />
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-white">
                                                Restricted Area Regulations & Security Protocols
                                            </h4>
                                            <p className="text-[8px] text-white/80 font-mono">
                                                Zero-Tolerance Non-Compliance Directive
                                            </p>
                                        </div>
                                    </div>

                                    {/* RESTRICTED ACCESS RULES */}
                                    <div className="mx-3 my-2 p-3 bg-black/45 backdrop-blur-md rounded-xl border border-white/20 space-y-2 text-[9px] text-white leading-snug">
                                        <div className="flex items-start gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[8px] shrink-0">1</span>
                                            <p><strong>Escort Pairing:</strong> Visitor must remain in the physical company of the assigned escort officer at all times inside restricted perimeter.</p>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[8px] shrink-0">2</span>
                                            <p><strong>Electronic Devices:</strong> Unapproved photography, video recording, Wi-Fi sniffing, or USB flash media insertion is strictly illegal and subject to seizure.</p>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[8px] shrink-0">3</span>
                                            <p><strong>Tailgating:</strong> Anti-passback is active on all access doors. Each entrant must physically present credentials individually.</p>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[8px] shrink-0">4</span>
                                            <p><strong>Surrender:</strong> Badge must be deposited into the automated turnstile capture receptacle upon exiting the facility.</p>
                                        </div>
                                    </div>

                                    {/* EMERGENCY EVACUATION INFO */}
                                    <div className="mx-3 p-2 bg-black/55 backdrop-blur-md border border-white/20 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between text-[9px] font-bold text-amber-300">
                                            <span className="flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-orange-400" />
                                                Emergency Rally Point:
                                            </span>
                                            <span className="text-white font-mono">ASSEMBLY AREA C (NORTH GATE)</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] font-bold text-cyan-300">
                                            <span className="flex items-center gap-1">
                                                <Compass className="w-3 h-3 text-cyan-300" />
                                                Emergency Egress Route:
                                            </span>
                                            <span className="text-white font-mono">STAIRWELL SECTOR-4</span>
                                        </div>
                                    </div>

                                    {/* HOST & OFFICER SIGNATURE STRIP */}
                                    <div className="px-4 py-2 border-t border-slate-800/80 bg-black/40">
                                        <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1">
                                            <span>ISSUING OFFICER SIGNATURE</span>
                                            <span>VISITOR ACKNOWLEDGEMENT</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 h-6 border-b border-dashed border-slate-600 flex items-end">
                                                <span className="text-[10px] font-serif italic text-cyan-300">Off. M. Vance #804</span>
                                            </div>
                                            <div className="flex-1 h-6 border-b border-dashed border-slate-600 flex items-end justify-end">
                                                <span className="text-[10px] font-serif italic text-amber-300 truncate max-w-[110px]">{selectedVisitor?.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 24/7 SOC HOTLINE & PROPERTY DISCLAIMER */}
                                    <div className="p-2.5 bg-slate-950 text-center border-t border-slate-800 text-[8px] text-slate-400">
                                        <p className="font-bold text-slate-300">PROPERTY OF {companyName}</p>
                                        <p className="text-[7px] text-slate-500 mt-0.5">
                                            If found, return immediately to any Security Station or call 24/7 SOC Dispatch: <strong>+1 (800) 555-0199 (Ext. 4400)</strong>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        STEP 4 CONTROLS: THEME ACCENT & ISSUE AUTHORIZATION BUTTON
                        (BUILT UNDER BADGE FOR MAXIMUM CLARITY & STREAMLINING)
                        ══════════════════════════════════════════════════════════════════ */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] mt-4 space-y-3 print:hidden">
                        {/* Interactive Badge Theme & Color Selector */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Badge Theme & Color Fill</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">
                                    {customColor.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Native Interactive Color Picker Swatch */}
                                <label 
                                    className="relative cursor-pointer shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-slate-500 shadow transition-all p-0.5 bg-slate-950 flex items-center justify-center group"
                                    title="Click to open color palette"
                                >
                                    <input
                                        type="color"
                                        value={customColor}
                                        onChange={(e) => {
                                            const col = e.target.value;
                                            setCustomColor(col);
                                            setBadgeTheme('custom');
                                        }}
                                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                    />
                                </label>

                                {/* Theme Preset Dropdown */}
                                <select
                                    value={badgeTheme}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setBadgeTheme(val);
                                        if (val === 'crimson') setCustomColor('#dc2626');
                                        else if (val === 'gold') setCustomColor('#f59e0b');
                                        else if (val === 'cyan') setCustomColor('#06b6d4');
                                        else if (val === 'hazard') setCustomColor('#f97316');
                                        else if (val === 'navy') setCustomColor('#2563eb');
                                        else if (val === 'emerald') setCustomColor('#10b981');
                                        else if (val === 'purple') setCustomColor('#8b5cf6');
                                    }}
                                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
                                >
                                    <option value="crimson">🔴 Crimson Red (Maximum Restricted)</option>
                                    <option value="gold">🟡 Amber Gold (Treasury & Vault)</option>
                                    <option value="cyan">🔵 Cyber Cyan (Datacenter & Core)</option>
                                    <option value="hazard">🟠 Hazard Orange (SCADA & High Voltage)</option>
                                    <option value="navy">🔷 Cobalt Navy (Standard Security)</option>
                                    <option value="emerald">🟢 Emerald Green (Biosafety & Lab)</option>
                                    <option value="purple">🟣 Ultraviolet (Special Access Program)</option>
                                    {badgeTheme === 'custom' && <option value="custom">🎨 Custom Color ({customColor.toUpperCase()})</option>}
                                </select>
                            </div>

                            {/* Card Fill Intensity Control */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                                <span className="text-slate-400 font-bold uppercase">Badge Fill:</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setBadgeFillStyle('vibrant')}
                                        className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                            badgeFillStyle === 'vibrant' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        Vibrant Fill
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBadgeFillStyle('solid')}
                                        className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                            badgeFillStyle === 'solid' ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        Solid Fill
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBadgeFillStyle('ambient')}
                                        className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                            badgeFillStyle === 'ambient' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        Ambient
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Primary Authorize & Issue Badge Button */}
                        <button
                            type="button"
                            onClick={handleIssueBadge}
                            disabled={isIssuing || !selectedVisitor}
                            className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-red-950/60 border border-red-500/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isIssuing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                    <span>Authorizing & Cryptographically Signing...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                    <span>Issue & Authorize Restricted Visitor Badge</span>
                                </>
                            )}
                        </button>

                        {/* Secondary Utility Actions (Print / Copy Token / RFID Tap) */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={handlePrintBadge}
                                className="py-2 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                title="Print Physical Badge Card"
                            >
                                <Printer className="w-3.5 h-3.5 text-blue-400" />
                                <span>Print Badge</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyPassToken}
                                className="py-2 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                title="Copy Scannable Token to Clipboard"
                            >
                                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                                <span>{copySuccess ? 'Copied!' : 'Copy Token'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={triggerRfidSimulation}
                                className="py-2 px-1 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                                title="Simulate NFC/RFID Airlock Tap"
                            >
                                <Wifi className="w-3.5 h-3.5" />
                                <span>Tap RFID</span>
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                /* ══════════════════════════════════════════════════════════════════
                    ULTRA-REALISTIC 3D ACCESS LEVEL CLEARANCE BADGE (MATCHES RESTRICTED BADGE SPEC)
                    ══════════════════════════════════════════════════════════════════ */
                <div className="w-full flex flex-col items-center">
                    
                    {/* Action Bar Above Badge Card */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] flex items-center justify-between mb-3 text-xs font-semibold px-1 print:hidden">
                        <div className="flex items-center gap-1.5">
                            {/* Toggle Front / Back Button */}
                            <button
                                type="button"
                                onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                title="Flip Badge to view Front or Back side"
                            >
                                <RotateCcw className="w-3 h-3 text-cyan-400" />
                                <span>{cardSide === 'front' ? 'Flip to Back' : 'Flip to Front'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowScanModal(true)}
                                className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Scan className="w-3 h-3 text-emerald-400" />
                                <span>Verify QR</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleCopyPassToken}
                                className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Copy Scannable Token to Clipboard"
                            >
                                {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                                <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={triggerRfidSimulation}
                                className="py-1.5 px-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shadow transition-all cursor-pointer"
                                title="Simulate Contactless Smartcard Reader Tap"
                            >
                                <Wifi className="w-3 h-3" />
                                <span>Tap RFID</span>
                            </button>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        ULTRA-REALISTIC 3D LANYARD BADGE (PRINT-OPTIMIZED)
                        ══════════════════════════════════════════════════════════════════ */}
                    <div ref={printableCardRef} className="print-badge-container w-full max-w-[340px] sm:max-w-[360px] flex flex-col items-center select-none">
                        
                        {/* 1. LANYARD STRAP: HIGH-VISIBILITY HEAVY-DUTY WEAVE */}
                        <div className="w-14 h-16 sm:h-20 relative overflow-hidden flex flex-col items-center shadow-lg print:hidden">
                            <div 
                                style={{
                                    background: `linear-gradient(180deg, #18181b 0%, ${activeBadgeColor}cc 50%, #18181b 100%)`,
                                    borderColor: `${activeBadgeColor}80`
                                }}
                                className="w-full h-full border-x relative flex items-center justify-center transition-all duration-300"
                            >
                                {/* Diagonal Security Hazard Micro-Texture */}
                                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_5px,#fff_5px,#fff_10px)]" />
                                <div className="absolute inset-y-0 left-1 w-0.5 border-r border-dotted border-white/20" />
                                <div className="absolute inset-y-0 right-1 w-0.5 border-l border-dotted border-white/20" />
                                <span className="text-[7px] font-black text-white tracking-widest uppercase rotate-90 whitespace-nowrap drop-shadow">
                                    CLEARANCE ACCESS
                                </span>
                            </div>
                        </div>

                        {/* 2. CHROME METALLIC SWIVEL LOBSTER CLAMP / CLIP */}
                        <div className="flex flex-col items-center -mt-1 z-20 print:hidden">
                            <div className="w-9 h-2.5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-sm shadow-sm border border-slate-300" />
                            <div className="w-4 h-3 rounded-full border-2 border-slate-300 bg-gradient-to-b from-slate-200 to-slate-400 -mt-0.5 shadow" />
                            <div className="w-6 h-7 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 rounded-b-xl border border-slate-300 shadow-md relative -mt-0.5 flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-slate-600 rounded-full absolute -right-0.5 top-1" />
                                <div className="w-2.5 h-4 rounded-full border border-slate-400/80 bg-slate-900/40" />
                            </div>
                        </div>

                        {/* 3. FROSTED CLEAR ACRYLIC BADGE HOLDER / SLEEVE */}
                        <div className="w-full bg-slate-900/50 backdrop-blur-md border-2 border-slate-700/80 rounded-[28px] p-2.5 sm:p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative -mt-2 z-10 print:bg-white print:border-none print:shadow-none print:p-0">
                            
                            {/* Acrylic Holder Punch Hole Slots */}
                            <div className="flex items-center justify-center gap-2 mb-2 print:hidden">
                                <div className="w-6 h-1.5 bg-slate-950/80 rounded-full border border-slate-700/60" />
                                <div className="w-14 h-3 bg-slate-950/90 rounded-full border border-slate-600/80 flex items-center justify-center shadow-inner">
                                    <div className="w-2 h-2 rounded-full bg-slate-400/40" />
                                </div>
                                <div className="w-6 h-1.5 bg-slate-950/80 rounded-full border border-slate-700/60" />
                            </div>

                            {/* ══════════════════════════════════════════════════════════
                                4. FRONT FACE OF THE ACCESS LEVEL BADGE
                                ══════════════════════════════════════════════════════════ */}
                            {cardSide === 'front' ? (
                                <div 
                                    style={{
                                        background: getBadgeSurfaceBackground(activeBadgeColor),
                                        borderColor: activeBadgeColor,
                                        boxShadow: `0 20px 50px -10px ${activeBadgeColor}55, 0 0 35px ${activeBadgeColor}35`
                                    }}
                                    className="print-card-surface w-full rounded-[22px] overflow-hidden border-2 text-white relative shadow-2xl flex flex-col justify-between transition-all duration-300"
                                >
                                    {/* Security Guilloché Background Geometric Waves */}
                                    <div className="absolute inset-0 pointer-events-none opacity-20">
                                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <pattern id="guillocheGridAccess" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <circle cx="20" cy="20" r="18" fill="none" stroke={activeBadgeColor} strokeWidth="0.5"/>
                                                    <circle cx="20" cy="20" r="12" fill="none" stroke="#ffffff" strokeWidth="0.4"/>
                                                    <path d="M0,20 Q10,0 20,20 T40,20" fill="none" stroke={activeBadgeColor} strokeWidth="0.4"/>
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill="url(#guillocheGridAccess)" />
                                        </svg>
                                    </div>

                                    {/* TOP WARNING CLEARANCE HEADER BANNER */}
                                    <div 
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.60) 100%)',
                                            borderBottom: '1px solid rgba(255,255,255,0.25)',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                        }}
                                        className="pt-3.5 pb-2.5 px-3 flex flex-col items-center text-center relative z-10"
                                    >
                                        <div className="flex items-center justify-between w-full px-1">
                                            <div className="flex items-center gap-1">
                                                <Key className="w-3.5 h-3.5 text-amber-300" />
                                                <span className="text-[9px] font-black tracking-widest uppercase text-white drop-shadow">
                                                    SECURITY CLEARANCE ACCESS
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-white border border-white/20">
                                                ID-1 / CR80
                                            </span>
                                        </div>

                                        <h3 className="text-[13px] font-black uppercase tracking-wider text-white mt-1 leading-tight drop-shadow-md">
                                            {activeClearanceLevel.name}
                                        </h3>
                                        <span className="text-[8px] font-mono tracking-widest text-amber-300 mt-0.5 font-bold uppercase drop-shadow-sm">
                                            TIER: {activeClearanceLevel.shortName}
                                        </span>
                                    </div>

                                    {/* COMPANY LOGO & OFFICIAL SUBTITLE */}
                                    <div className="px-4 pt-2.5 pb-1 flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shadow border border-slate-700 shrink-0">
                                                <img 
                                                    src={companyLogo} 
                                                    alt="Logo" 
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/logo.png';
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[170px]">
                                                    {companyName}
                                                </h4>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300 block -mt-0.5">
                                                    Facility Access Credential
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contactless RFID / MIFARE Smart Chip Icon */}
                                        <div className="flex flex-col items-end text-cyan-300" title="Contactless MIFARE DESFire EV3 RFID Chip Encoded">
                                            <div className="flex items-center gap-1">
                                                <Wifi className="w-3.5 h-3.5 rotate-90" />
                                                <span className="text-[8px] font-mono font-bold">RFID</span>
                                            </div>
                                            <span className="text-[7px] font-mono text-slate-300">13.56 MHz</span>
                                        </div>
                                    </div>

                                    {/* VISITOR PORTRAIT PHOTO WITH HOLOGRAPHIC SECURITY CORNERS */}
                                    <div className="relative my-2.5 flex items-center justify-center">
                                        
                                        {/* Security Corner Reticles */}
                                        <div className="relative p-1">
                                            {/* Photo Frame Container */}
                                            <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-[0_0_25px_rgba(0,0,0,0.8)] flex items-center justify-center">
                                                <img 
                                                    src={selectedVisitor?.photo ? resolvePhotoUrl(selectedVisitor.photo) : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'} 
                                                    alt={selectedVisitor?.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                                                    }}
                                                />

                                                {/* Biometric Mesh Overlay Effect */}
                                                <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay pointer-events-none" />
                                                
                                                {/* Official Authorization Stamp Overlay */}
                                                <div 
                                                    style={{ backgroundColor: activeBadgeColor }}
                                                    className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white rounded text-[8px] font-black uppercase tracking-widest border border-white/40 shadow rotate-[-6deg]"
                                                >
                                                    AUTHORIZED
                                                </div>
                                            </div>

                                            {/* Holographic Security Foil Watermark Badge */}
                                            <div className="absolute -top-2 -right-2 z-20 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-cyan-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center animate-pulse">
                                                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-[7px] font-black text-amber-300 uppercase leading-none text-center">
                                                    <Sparkles className="w-2.5 h-2.5 text-amber-300 mb-0.5" />
                                                    <span>SEAL</span>
                                                </div>
                                            </div>

                                            {/* Corner Reticle Brackets */}
                                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: activeBadgeColor }} />
                                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: activeBadgeColor }} />
                                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: activeBadgeColor }} />
                                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: activeBadgeColor }} />
                                        </div>
                                    </div>

                                    {/* VISITOR FULL NAME & CREDENTIALS */}
                                    <div className="text-center px-4 pt-0.5 pb-2 relative z-10">
                                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-sm truncate">
                                            {selectedVisitor?.name || 'Authorized Visitor'}
                                        </h2>
                                        <div className="flex items-center justify-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-bold text-amber-400 tracking-wide truncate max-w-[190px]">
                                                {selectedVisitor?.company || 'Enterprise Visitor'}
                                            </span>
                                            <span className="text-[8px] font-mono font-bold text-cyan-300 bg-black/45 px-1.5 py-0.5 rounded border border-cyan-500/40">
                                                ID: {visitorUserId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* KEY-VALUE SECURITY CREDENTIAL TABLE (MATCHES RESTRICTED BADGE IMAGE) */}
                                    <div className="mx-3 my-1 px-4 py-2 relative z-10 text-[10px] space-y-1 bg-black/45 backdrop-blur-md rounded-xl border border-white/25 shadow-sm">
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Badge ID</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono font-black text-amber-300 tracking-wider truncate drop-shadow">{currentBadgeNumber}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">User ID</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono font-black text-cyan-300 tracking-wider truncate drop-shadow-sm">{visitorUserId}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Govt ID / Ref</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono font-bold text-white tracking-wider truncate">{selectedVisitor?.id_number || selectedVisitor?.ref_code || 'PASS-89214-GB'}</span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Clearance Level</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-bold text-emerald-300 truncate">
                                                {activeClearanceLevel.shortName}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Allowed Zones</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 font-mono text-cyan-200 font-bold truncate text-[9px]">
                                                {selectedAccessZones.length} Zones Authorized
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-12 items-baseline">
                                            <span className="col-span-4 text-white/80 font-bold uppercase text-[9px]">Valid Window</span>
                                            <span className="col-span-1 text-white/60 font-bold text-center">:</span>
                                            <span className="col-span-7 text-yellow-200 font-bold truncate text-[9px]">
                                                {validityHours} Hours (Single Shift)
                                            </span>
                                        </div>
                                    </div>

                                    {/* MANDATORY ESCORT / CLEARANCE BANNER */}
                                    <div className="mx-3 my-1 px-3 py-1 bg-black/55 backdrop-blur-md text-white text-center text-[9px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 rounded-lg border border-white/20 shadow-inner">
                                        {escortRequired ? (
                                            <>
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                                <span className="drop-shadow-sm">SECURITY ESCORT MANDATORY AT ALL TIMES</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                <span className="drop-shadow-sm">ALL-ACCESS FACILITY CLEARANCE AUTHORIZED</span>
                                            </>
                                        )}
                                    </div>

                                    {/* BARCODE & OPTICAL SECTION */}
                                    <div className="py-2.5 px-3 bg-white text-slate-900 text-center flex flex-col items-center justify-center relative">
                                        {/* Realistic Optical Barcode Stripes */}
                                        <div className="w-full flex items-center justify-between px-2 h-7 overflow-hidden">
                                            {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,4,1,2,1,3,2,1].map((w, i) => (
                                                <div 
                                                    key={i} 
                                                    style={{ width: `${w * 1.6}px` }} 
                                                    className={`h-full ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`} 
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between w-full px-2 text-[8px] font-mono font-black text-slate-800 tracking-wider mt-1">
                                            <span>{currentBadgeNumber}</span>
                                            <span className="text-blue-900 font-bold">{visitorUserId}</span>
                                            <span>{activeClearanceLevel.id}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ══════════════════════════════════════════════════════════
                                    5. BACK FACE OF THE ACCESS LEVEL BADGE
                                    ══════════════════════════════════════════════════════════ */
                                <div 
                                    style={{
                                        background: getBadgeSurfaceBackground(activeBadgeColor),
                                        borderColor: activeBadgeColor,
                                        boxShadow: `0 20px 50px -10px ${activeBadgeColor}55, 0 0 35px ${activeBadgeColor}35`
                                    }}
                                    className="print-card-back w-full rounded-[22px] overflow-hidden border-2 text-white relative shadow-2xl flex flex-col justify-between transition-all duration-300 min-h-[460px]"
                                >
                                    {/* MAGNETIC STRIPE MOCKUP AT TOP OF CARD BACK */}
                                    <div className="w-full h-11 bg-black border-y border-slate-700/80 relative shadow-inner flex items-center justify-center">
                                        <span className="text-[7px] font-mono text-slate-400 tracking-widest uppercase">
                                            ENCODED MAGNETIC STRIPE • CLEARANCE TRACK 1 & 2 SECURE
                                        </span>
                                    </div>

                                    {/* CLEARANCE REGULATIONS HEADER */}
                                    <div 
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)',
                                            borderBottom: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                        className="p-3 flex items-center gap-2"
                                    >
                                        <AlertOctagon className="w-5 h-5 text-amber-300 shrink-0" />
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-white">
                                                Security Clearance Regulations & Facility Rules
                                            </h4>
                                            <p className="text-[8px] text-white/80 font-mono">
                                                Official Facility Access Directives
                                            </p>
                                        </div>
                                    </div>

                                    {/* AUTHORIZED ZONES LIST */}
                                    <div className="mx-3 my-2 p-3 bg-black/45 backdrop-blur-md rounded-xl border border-white/20 space-y-1.5 text-[9px] text-white">
                                        <span className="text-[8px] font-mono uppercase tracking-wider text-cyan-300 font-bold block mb-1">
                                            Authorized Checkpoint Access Zones ({selectedAccessZones.length}):
                                        </span>
                                        {selectedAccessZones.map((z, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-slate-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                                <span className="truncate">{z}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* EMERGENCY EVACUATION INFO */}
                                    <div className="mx-3 p-2 bg-black/55 backdrop-blur-md border border-white/20 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between text-[9px] font-bold text-amber-300">
                                            <span className="flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-orange-400" />
                                                Emergency Rally Point:
                                            </span>
                                            <span className="text-white font-mono">PRIMARY MAIN ENTRANCE PLAZA</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] font-bold text-cyan-300">
                                            <span className="flex items-center gap-1">
                                                <Compass className="w-3 h-3 text-cyan-300" />
                                                Emergency Egress Route:
                                            </span>
                                            <span className="text-white font-mono">STAIRWELL ALPHA-1</span>
                                        </div>
                                    </div>

                                    {/* HOST & ISSUER SIGNATURE STRIP */}
                                    <div className="px-4 py-2 border-t border-slate-800/80 bg-black/40">
                                        <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1">
                                            <span>ISSUING OFFICER SIGNATURE</span>
                                            <span>VISITOR ACKNOWLEDGEMENT</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 h-6 border-b border-dashed border-slate-600 flex items-end">
                                                <span className="text-[10px] font-serif italic text-cyan-300">Sec. Clearance Desk</span>
                                            </div>
                                            <div className="flex-1 h-6 border-b border-dashed border-slate-600 flex items-end justify-end">
                                                <span className="text-[10px] font-serif italic text-amber-300 truncate max-w-[110px]">{selectedVisitor?.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 24/7 SOC HOTLINE & PROPERTY DISCLAIMER */}
                                    <div className="p-2.5 bg-slate-950 text-center border-t border-slate-800 text-[8px] text-slate-400">
                                        <p className="font-bold text-slate-300">PROPERTY OF {companyName}</p>
                                        <p className="text-[7px] text-slate-500 mt-0.5">
                                            If found, return immediately to Front Desk or Security Station • 24/7 SOC Dispatch
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* Buttons below Access Level Badge */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] flex items-center gap-2 mt-4 print:hidden">
                        <button
                            type="button"
                            onClick={handlePrintBadge}
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Security Badge</span>
                        </button>
                        <button
                            type="button"
                            onClick={triggerRfidSimulation}
                            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 font-bold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                            title="Test Checkpoint Gate RFID Reader"
                        >
                            <Wifi className="w-4 h-4" />
                            <span>RFID Tap</span>
                        </button>
                    </div>

                </div>
            )}
        </div>
    </div>

            {/* ══════════════════════════════════════════════════════════════════
                RECENT RESTRICTED ACCESS PASSES REGISTRY TABLE
                ══════════════════════════════════════════════════════════════════ */}
            <div className="print:hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-white">
                                Active Area & Access Level Credentials Registry
                            </h3>
                            <p className="text-xs text-slate-400">
                                Real-time monitoring of issued perimeter passes, clearance level badges, and remaining validity windows
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{issuedBadges.length} Active Badges</span>
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
                                <th className="pb-3 px-3">Badge ID & UID</th>
                                <th className="pb-3 px-3">Visitor Profile & Company</th>
                                <th className="pb-3 px-3">Authorized Zone</th>
                                <th className="pb-3 px-3">Clearance Tier</th>
                                <th className="pb-3 px-3">Escort Officer</th>
                                <th className="pb-3 px-3">Window (Issued - Exp)</th>
                                <th className="pb-3 px-3">Status</th>
                                <th className="pb-3 px-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {issuedBadges.map((badge, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="py-3 px-3 font-mono">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`font-bold ${badge.badgeType === 'ACCESS_LEVEL' ? 'text-indigo-400' : 'text-red-400'}`}>
                                                {badge.badgeId}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                badge.badgeType === 'ACCESS_LEVEL'
                                                    ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-300'
                                                    : 'bg-red-950/80 border border-red-700/60 text-red-300'
                                            }`}>
                                                {badge.badgeType === 'ACCESS_LEVEL' ? 'ACCESS LEVEL' : 'RESTRICTED'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-cyan-400 font-bold tracking-tight">UID: {badge.userId || 'USR-0101'}</div>
                                        <span className="text-[9px] text-slate-500 font-normal">RFID: {badge.rfidUid}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shrink-0 shadow-md relative group">
                                                <img 
                                                    src={badge.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'} 
                                                    alt={badge.visitorName} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay pointer-events-none" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-white text-xs truncate max-w-[170px]">{badge.visitorName}</div>
                                                <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{badge.company}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="font-semibold text-amber-300">{badge.zoneCode}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-300 text-[10px] font-bold">
                                            {badge.level}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-emerald-400 font-medium">
                                        {badge.escort}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-slate-300">
                                        {badge.issuedAt} → <span className="text-amber-400">{badge.expiresAt}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                            badge.status === 'REVOKED'
                                                ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        }`}>
                                            {badge.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3">
                                        {/* Horizontal Action Icon Toolbar */}
                                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                            {/* 1. View / Load Badge in Studio */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const found = arrivalsList.find(a => a.name?.toLowerCase() === badge.visitorName?.toLowerCase());
                                                    if (found) {
                                                        setSelectedVisitor(found);
                                                    } else {
                                                        setSelectedVisitor({
                                                            id: 999,
                                                            name: badge.visitorName,
                                                            company: badge.company,
                                                            role: 'Authorized Guest',
                                                            id_number: badge.badgeId,
                                                            photo: badge.photo,
                                                            phone: '+1 (555) 000-0000',
                                                            email: 'visitor@enterprise.com',
                                                            host_name: 'Security Operations',
                                                            ref_code: badge.badgeId,
                                                            defaultZone: 'ZONE-A',
                                                            access_level: badge.level
                                                        });
                                                    }

                                                    if (badge.badgeType === 'ACCESS_LEVEL') {
                                                        setBadgeSystemMode('access_level');
                                                        const lvl = ACCESS_LEVELS.find(l => l.shortName === badge.level || l.name.includes(badge.level));
                                                        if (lvl) handleLevelSelect(lvl.id);
                                                    } else {
                                                        setBadgeSystemMode('restricted');
                                                        const z = RESTRICTED_ZONES.find(x => x.code === badge.zoneCode || badge.zoneCode?.includes(x.id));
                                                        if (z) handleZoneChange(z);
                                                    }
                                                    window.scrollTo({ top: 200, behavior: 'smooth' });
                                                }}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm border border-slate-700/60"
                                                title="Inspect & Load in Badge Studio"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>

                                            {/* 2. Print Physical Badge */}
                                            <button
                                                type="button"
                                                onClick={handlePrintBadge}
                                                className="p-1.5 bg-blue-950/60 hover:bg-blue-900 border border-blue-800/60 text-blue-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm"
                                                title="Print Physical ISO Badge"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                            </button>

                                            {/* 3. Test RFID Scan */}
                                            <button
                                                type="button"
                                                onClick={triggerRfidSimulation}
                                                className="p-1.5 bg-teal-950/60 hover:bg-teal-900 border border-teal-800/60 text-teal-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm"
                                                title="Simulate NFC/RFID Turnstile Tap"
                                            >
                                                <Wifi className="w-3.5 h-3.5" />
                                            </button>

                                            {/* 4. Copy Pass Token */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`RESTRICTED|${badge.badgeId}|${badge.zoneCode}|${badge.visitorName}|${badge.rfidUid}`);
                                                    setCopySuccess(true);
                                                    setTimeout(() => setCopySuccess(false), 2000);
                                                }}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm border border-slate-700/60"
                                                title="Copy Encrypted Pass Token"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>

                                            {/* 5. Revoke / Restore Badge */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIssuedBadges(prev => prev.map(b => 
                                                        b.badgeId === badge.badgeId 
                                                            ? { ...b, status: b.status === 'REVOKED' ? 'ACTIVE' : 'REVOKED' } 
                                                            : b
                                                    ));
                                                }}
                                                className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-sm border ${
                                                    badge.status === 'REVOKED'
                                                        ? 'bg-amber-950/80 border-amber-700/80 text-amber-300 hover:text-white'
                                                        : 'bg-orange-950/60 hover:bg-orange-900 border-orange-800/60 text-orange-400 hover:text-white'
                                                }`}
                                                title={badge.status === 'REVOKED' ? 'Restore Badge Access' : 'Revoke / Flag Badge'}
                                            >
                                                <AlertOctagon className="w-3.5 h-3.5" />
                                            </button>

                                            {/* 6. Delete Badge Permanently */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIssuedBadges(prev => prev.filter(b => b.badgeId !== badge.badgeId));
                                                }}
                                                className="p-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/70 text-red-400 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm group"
                                                title="Delete Badge Record"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL 1: TEST VERIFICATION QR SCANNER
                ══════════════════════════════════════════════════════════════════ */}
            {showScanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Scan className="w-5 h-5" />
                                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                                    Optical QR Credential Inspector
                                </h3>
                            </div>
                            <button onClick={() => setShowScanModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scanned Payload Card */}
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">DIGITAL SIGNATURE VALID</span>
                                <span className="text-[10px] font-mono text-slate-500">SHA-256</span>
                            </div>

                            <div className="p-3 bg-black rounded-xl font-mono text-[11px] text-amber-300 break-all leading-relaxed border border-slate-800">
                                {dynamicQrToken}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                    <span className="text-slate-500 text-[10px] uppercase block font-bold">Authorized Visitor</span>
                                    <span className="font-bold text-white">{selectedVisitor?.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[10px] uppercase block font-bold">Restricted Zone</span>
                                    <span className="font-bold text-red-400">{selectedZone.code}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[10px] uppercase block font-bold">Assigned Escort</span>
                                    <span className="font-bold text-emerald-300">{assignedEscort.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[10px] uppercase block font-bold">Clearance Level</span>
                                    <span className="font-bold text-amber-300">{clearanceTier}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowScanModal(false)}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            Close Inspector
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL 2: NFC / RFID TURNSTILE TAP SIMULATOR
                ══════════════════════════════════════════════════════════════════ */}
            {showRfidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                Contactless RFID Gate Reader
                            </span>
                            <button onClick={() => setShowRfidModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Interactive Reader Target */}
                        <div className="py-6 flex flex-col items-center justify-center">
                            <div className={`w-28 h-28 rounded-3xl border-2 flex items-center justify-center transition-all duration-500 ${
                                rfidStatus === 'SCANNING'
                                    ? 'bg-amber-500/10 border-amber-500 animate-pulse scale-105'
                                    : rfidStatus === 'GRANTED'
                                    ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.5)] scale-110'
                                    : 'bg-slate-950 border-slate-700'
                            }`}>
                                {rfidStatus === 'SCANNING' ? (
                                    <Wifi className="w-12 h-12 text-amber-400 animate-ping" />
                                ) : rfidStatus === 'GRANTED' ? (
                                    <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-75" />
                                ) : (
                                    <Wifi className="w-12 h-12 text-slate-500" />
                                )}
                            </div>

                            <div className="mt-4">
                                <h4 className={`text-base font-black uppercase tracking-wider ${
                                    rfidStatus === 'GRANTED' ? 'text-emerald-400' : 'text-white'
                                }`}>
                                    {rfidStatus === 'SCANNING' ? 'Reading MIFARE DESFire UID...' : 'ACCESS GRANTED - AIRLOCK UNLOCKED'}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 font-mono">
                                    UID: {rfidSimulatedUid}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Authorized Door:</span>
                                <span className="font-bold text-white">{selectedZone.accessDoors[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Zone Cleared:</span>
                                <span className="font-bold text-red-400">{selectedZone.code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Turnstile Barrier:</span>
                                <span className="font-bold text-emerald-400">UNLATCHED (4s)</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowRfidModal(false)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            Acknowledge & Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
