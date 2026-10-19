import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, Download, Printer, Share2, Calendar, Clock, MapPin, User, ShieldCheck, CheckCircle2, X, Briefcase, Phone, Mail, Hash, FileText, Building, CreditCard } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { visitorPortalApi } from '../../services/api';
import BackButton from '../../components/common/BackButton';
export default function VisitorPass({ passData, onOpenQRScanner }) {
    const [, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [liveAppt, setLiveAppt] = useState(null);
    const [passImgError, setPassImgError] = useState(false);
    const [qrImgError, setQrImgError] = useState(false);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    useEffect(() => {
        let cancelled = false;
        async function fetchLiveAppointment() {
            try {
                const res = await visitorPortalApi.getAppointments();
                const appts = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                if (appts.length > 0 && !cancelled) {
                    const targetId = passData?.appointmentId || passData?.referenceNo || passData?.reference_code || passData?.id;
                    const matched = targetId
                        ? appts.find(a => String(a.id) === String(targetId) || String(a.reference_code) === String(targetId))
                        : null;
                    setLiveAppt(matched || appts[0]);
                }
            }
            catch (e) {
                console.warn('[VisitorPass] Failed to fetch live appointment:', e);
            }
        }
        fetchLiveAppointment();
        return () => { cancelled = true; };
    }, [user, passData, updateTrigger]);
    useEffect(() => {
        const handleUpdate = () => {
            setPassImgError(false);
            setQrImgError(false);
            setUpdateTrigger((prev) => prev + 1);
        };
        const handleApptUpdate = () => {
            setPassImgError(false);
            setQrImgError(false);
            setUpdateTrigger((prev) => prev + 1);
        };
        window.addEventListener('storage', handleUpdate);
        window.addEventListener('user_updated', handleUpdate);
        window.addEventListener('appointment_status_changed', handleApptUpdate);
        window.addEventListener('appointment_updated', handleApptUpdate);
        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('user_updated', handleUpdate);
            window.removeEventListener('appointment_status_changed', handleApptUpdate);
            window.removeEventListener('appointment_updated', handleApptUpdate);
        };
    }, []);
    const isValidImageUrl = (url) => {
        if (!url || typeof url !== 'string')
            return false;
        const clean = url.trim();
        if (!clean || clean.includes('/uploads/mock-'))
            return false;
        if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('./'))
            return true;
        if (/\.(jpg|jpeg|png|webp|gif|svg|bmp|ico)/i.test(clean))
            return true;
        return false;
    };
    const getInitials = (name) => {
        if (!name)
            return 'V';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2)
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };
    // Fetch profile photo & pass data from all visitor profile storage sources
    const getInitialPassData = () => {
        const authName = user?.fullName || user?.full_name || user?.username || 'Visitor';
        const authEmail = (user?.email || '').toLowerCase();
        const currentUserId = user?.id || 1;
        let p = {};
        if (passData)
            p = { ...passData };
        const pickValidPhoto = (...candidates) => {
            for (const cand of candidates) {
                if (cand && isValidImageUrl(String(cand)))
                    return String(cand);
            }
            return '';
        };
        // 0. Explicit uploaded photo keys (highest priority)
        const storedUserPhoto = sessionStorage.getItem('visitor_uploaded_photo') ||
            localStorage.getItem('visitor_uploaded_photo') ||
            (currentUserId ? sessionStorage.getItem(`user_photo_${currentUserId}`) : null) ||
            (currentUserId ? localStorage.getItem(`user_photo_${currentUserId}`) : null);
        // 1. Session & Auth context profile photo strictly for current user
        const authPhoto = pickValidPhoto(storedUserPhoto, user?.profile_photo, user?.avatarUrl, user?.photo_url, user?.photoUrl, user?.avatar, user?.photo);
        // 2. Active visitor profile (matching current user email if present)
        try {
            const active = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            if (active) {
                const parsed = JSON.parse(active);
                const pEmail = (parsed.email || '').toLowerCase().trim();
                if (!pEmail || !authEmail || pEmail === authEmail) {
                    const validPhoto = pickValidPhoto(parsed.photo_url, parsed.photoUrl, parsed.avatarUrl, parsed.photo, parsed.avatar, parsed.visitorPhoto);
                    delete parsed.visitorPhoto;
                    p = { ...parsed, ...p };
                    if (validPhoto)
                        p.visitorPhoto = validPhoto;
                }
            }
        }
        catch (e) { }
        // 3. Registered visitor data (matching current user email if present)
        try {
            const reg = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
            if (reg) {
                const parsed = JSON.parse(reg);
                const rEmail = (parsed.email || '').toLowerCase().trim();
                if (!rEmail || !authEmail || rEmail === authEmail) {
                    const validPhoto = pickValidPhoto(parsed.photo_url, parsed.photoUrl, parsed.avatarUrl, parsed.photo, parsed.avatar, parsed.visitorPhoto);
                    delete parsed.visitorPhoto;
                    p = { ...parsed, ...p };
                    if (validPhoto)
                        p.visitorPhoto = validPhoto;
                }
            }
        }
        catch (e) { }
        // 4. Sanitize all photo properties in object p — prioritize authPhoto
        const resolvedPhoto = authPhoto || pickValidPhoto(p.visitorPhoto, p.photo_url, p.photoUrl, p.avatarUrl, p.photo, p.avatar, storedUserPhoto);
        const finalPhoto = resolvePhotoUrl(resolvedPhoto);
        const activeAppt = liveAppt || p;
        const rawStatus = (activeAppt.approval_status || activeAppt.appointment_status || activeAppt.status || p.status || 'PENDING').toString().toUpperCase();
        const rawCheckOut = (activeAppt.checkout_time || p.checkOutTime || p.checkout_time || '');
        const hasCheckedOut = Boolean((rawCheckOut && rawCheckOut !== '-' && rawCheckOut !== 'null') || rawStatus === 'COMPLETED' || rawStatus.includes('CHECKED_OUT') || rawStatus.includes('CHECKED OUT'));

        let normalizedStatus = 'PENDING';
        if (rawStatus.includes('CANCEL')) {
            normalizedStatus = 'CANCELLED';
        } else if (rawStatus.includes('REJECT')) {
            normalizedStatus = 'REJECTED';
        } else if (rawStatus.includes('RESCHED')) {
            normalizedStatus = 'RESCHEDULED';
        } else if (rawStatus === 'COMPLETED' || hasCheckedOut) {
            normalizedStatus = 'COMPLETED';
        } else if (rawStatus.includes('CHECKED_IN') || rawStatus.includes('CHECKED IN') || rawStatus === 'ACTIVE' || rawStatus === 'IN_PROGRESS') {
            normalizedStatus = 'CHECKED IN';
        } else if (rawStatus.includes('APPROV') || rawStatus === 'CONFIRMED') {
            normalizedStatus = 'APPROVED';
        } else {
            normalizedStatus = 'PENDING';
        }

        const isApproved = normalizedStatus === 'APPROVED' || normalizedStatus === 'CHECKED IN' || normalizedStatus === 'COMPLETED';
        const verificationStatus = 
            normalizedStatus === 'APPROVED' ? 'Approved / Verified' :
            normalizedStatus === 'CHECKED IN' ? 'Checked In / Active' :
            normalizedStatus === 'COMPLETED' ? 'Completed / Checked Out' :
            normalizedStatus === 'RESCHEDULED' ? 'Rescheduled' :
            normalizedStatus === 'CANCELLED' ? 'Cancelled' :
            normalizedStatus === 'REJECTED' ? 'Rejected' :
            'Pending Verification';

        const visitorCode = p.visitor_code || p.historyCode || user?.visitorCode || user?.userCode || `VIS-2026-${String(currentUserId).padStart(6, '0')}`;
        const refNumber = activeAppt.reference_code || p.reference_number || p.referenceNumber || user?.referenceNumber || `REF-REG-2026-${String(currentUserId).padStart(3, '0')}`;
        // Build authoritative visitor pass for THIS logged in user
        return {
            visitorName: authName,
            visitorPhoto: finalPhoto,
            visitorId: visitorCode,
            referenceNo: refNumber,
            visitorCategory: p.category || p.visitor_category || 'General Visitor',
            appointmentTitle: activeAppt.purpose || activeAppt.title || activeAppt.appointment_title || 'Business Meeting',
            appointmentId: activeAppt.reference_code || activeAppt.appointment_number || activeAppt.id || 'APT-2026',
            hostName: activeAppt.hostName || activeAppt.host_name || activeAppt.host || p.hostName || p.host || 'Host Representative',
            hostDepartment: activeAppt.hostDepartment || activeAppt.department_name || activeAppt.department || p.department || 'Executive Office',
            location: activeAppt.location || activeAppt.building_name || activeAppt.room_name || p.location || 'Main HQ',
            date: activeAppt.scheduled_start ? new Date(activeAppt.scheduled_start).toLocaleDateString() : new Date().toLocaleDateString(),
            time: activeAppt.scheduled_start ? `${new Date(activeAppt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '09:00 AM - 11:30 AM',
            accessPoint: activeAppt.roomName || activeAppt.room_name || 'Main Gate / Reception',
            status: normalizedStatus,
            rawStatus: rawStatus,
            normalizedStatus: normalizedStatus,
            email: authEmail || p.email || '-',
            phone: p.phone || user?.phone || '-',
            company: (!p.company || ['information national', 'red cloud', 'africom', 'vms enterprise', 'abc company'].some(x => p.company.toLowerCase().includes(x))) ? 'IT Park' : p.company,
            identityType: p.identityType || p.id_type || 'National ID',
            identityNumber: p.identityNumber || p.id_number || 'Not provided',
            purpose: activeAppt.purpose || p.purpose || 'Visitor Registration',
            branch: activeAppt.branch_name || p.branch || 'Main HQ',
            passNumber: p.passNumber || p.pass_number || `VP-2026-${String(currentUserId).padStart(4, '0')}`,
            photoUrl: finalPhoto,
            photo: finalPhoto,
            avatar: finalPhoto,
            checkOutTime: rawCheckOut || '-',
            checkedOut: hasCheckedOut,
            checked_out: hasCheckedOut,
            is_checked_out: hasCheckedOut,
            checkout_time: rawCheckOut || '-',
            registeredOn: p.registeredOn || new Date().toLocaleDateString(),
            verificationStatus: verificationStatus
        };
    };
    const data = getInitialPassData();
    useEffect(() => {
        setPassImgError(false);
        setQrImgError(false);
    }, [data.visitorPhoto, data.photoUrl]);
    useEffect(() => {
        // Plain text key-value format for clean scanning on any scanner/camera (not JSON)
        const qrPayload = [
            `VisitorId: ${data.visitorId}`,
            `Name: ${data.visitorName}`,
            `Category: ${data.visitorCategory || 'General Visitor'}`,
            `Phone: ${data.phone || 'N/A'}`,
            `Email: ${data.email || 'N/A'}`,
            `Company: ${data.company || 'N/A'}`,
            `Branch: ${data.branch || 'Main HQ'}`,
            `Identity: ${data.identityType || 'ID'} (${data.identityNumber || 'N/A'})`,
            `PassNo: ${data.passNumber || 'N/A'}`,
            `AppointmentId: ${data.appointmentId}`,
            `Title: ${data.appointmentTitle}`,
            `Host: ${data.hostName}`,
            `AccessPoint: ${data.accessPoint}`,
            `Location: ${data.location}`,
            `Purpose: ${data.purpose || 'Visit'}`,
            `ValidDate: ${data.date}`,
            `ValidTime: ${data.time}`,
            `Status: ${data.status}`
        ].join('\n');
        QRCode.toDataURL(qrPayload, {
            width: 450,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        })
            .then((url) => setQrCodeUrl(url))
            .catch((err) => console.error('QR code generation error:', err));
    }, [data]);
    const handlePrint = () => {
        window.print();
    };
    const handleBackToHistory = () => {
        setSearchParams({ view: 'visit_history' });
    };
    /* ── Inline style helpers (bypass _compatibility.scss !important overrides) ── */
    const sectionLabel = { color: '#94a3b8', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1e293b' };
    const fieldLabel = { color: '#64748b', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' };
    const fieldValue = { color: '#f1f5f9', fontWeight: 700, fontSize: '13px' };
    return (<div className="space-y-6 text-xs font-semibold" style={{ color: '#e2e8f0' }}>
      {/* Breadcrumb Header with Back Button */}
      <div className="no-print">
        <div className="d-flex align-items-center gap-3 mb-2">
          <BackButton onClick={handleBackToHistory} title={t('visitorPass.backToHistory')} fallbackUrl="/dashboard"/>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', color: '#64748b', display: 'block', marginBottom: '2px' }}>
              {t('sidebar.dashboard')} &gt; {t('visitorPass.digitalPass')}
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>{t('visitorPass.activeDigitalPass')}</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SINGLE UNIFIED CARD                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>

        {/* ── TOP: Pass Badge + Details Row (Compact Card Height) ── */}
        <div className="row g-0 align-items-start">
          {/* Left: Physical Lanyard Badge (Compact height fit-content) */}
          <div className="col-12 col-lg-5 p-3 flex flex-col items-center justify-start">
            <div className="rounded-[1.8rem] shadow-xl overflow-hidden w-full max-w-sm" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' }}>
              <div>
                {/* Lanyard Hole */}
                <div className="pt-2 text-center" style={{ backgroundColor: '#247040' }}>
                  <div className="w-9 h-1.5 rounded-full mx-auto" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}></div>
                </div>

                {/* Green Header */}
                <div className="px-4 pt-2 pb-6 text-center relative" style={{ backgroundColor: '#247040' }}>
                  <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '26px', letterSpacing: '-0.025em', textTransform: 'uppercase', lineHeight: 1 }}>{t('visitorPass.visitor')}</div>
                  <div style={{ color: '#dcfce7', fontWeight: 700, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>{t('visitorPass.temporaryPass')}</div>
                  <div className="absolute -bottom-1 left-0 right-0 overflow-hidden leading-none pointer-events-none">
                    <svg className="relative block w-full h-6" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ color: '#ffffff' }}>
                      <path d="M0,0 C300,90 600,-40 1200,60 L1200,120 L0,120 Z" fill="currentColor"></path>
                    </svg>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 pt-1 pb-3 text-center space-y-2.5 relative z-10" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                  {/* Status Badge */}
                  {(() => {
                    const st = data.normalizedStatus || 'PENDING';
                    let badgeStyle = { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
                    if (st === 'APPROVED') {
                      badgeStyle = { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
                    } else if (st === 'CHECKED IN') {
                      badgeStyle = { backgroundColor: '#ccfbf1', color: '#0f766e', border: '1px solid #5eead4' };
                    } else if (st === 'COMPLETED') {
                      badgeStyle = { backgroundColor: '#e0f2fe', color: '#1e40af', border: '1px solid #93c5fd' };
                    } else if (st === 'RESCHEDULED') {
                      badgeStyle = { backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' };
                    } else if (st === 'CANCELLED' || st === 'REJECTED') {
                      badgeStyle = { backgroundColor: '#ffe4e6', color: '#9f1239', border: '1px solid #fca5a5' };
                    }
                    return (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm" style={badgeStyle}>
                        <CheckCircle2 size={12}/>
                        <span>{st}</span>
                      </div>
                    );
                  })()}

                  {/* Circular Profile Photo */}
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden flex items-center justify-center shadow-md relative" style={{ backgroundColor: '#f1f5f9', border: '3px solid #247040', color: '#247040' }}>
                    {!passImgError && isValidImageUrl(data.visitorPhoto || data.photo || data.avatar || data.photoUrl) ? (<img src={resolvePhotoUrl(data.visitorPhoto || data.photo || data.avatar || data.photoUrl)} alt={data.visitorName} className="w-full h-full object-cover" onError={() => setPassImgError(true)}/>) : (<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-teal-900 text-white font-black text-xl tracking-wider">
                        {getInitials(data.visitorName)}
                      </div>)}
                  </div>

                  {/* Name */}
                  <div>
                    <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.025em' }}>{data.visitorName}</div>
                    <div style={{ color: '#15803d', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px' }}>{data.visitorCategory || t('visitorPass.authorizedVisitor')}</div>
                  </div>

                  {/* ID Grid */}
                  <div className="rounded-lg p-2 text-left space-y-1 font-mono" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '9px' }}>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748b', fontWeight: 700 }}>{t('visitorPass.visitorId')}:</span>
                      <span style={{ color: '#0f172a', fontWeight: 900 }}>{data.visitorId}</span>
                    </div>
                    <div className="flex justify-between" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2px' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>{t('visitorPass.refNo')}:</span>
                      <span style={{ color: '#0f172a', fontWeight: 900 }}>{data.referenceNo}</span>
                    </div>
                  </div>

                  {/* Dynamic QR Code Encoding Key-Value Text Details */}
                  <div className="flex flex-col items-center">
                    <div onClick={() => setQrModalOpen(true)} className="relative inline-block p-2 rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}>
                      {qrCodeUrl ? (<img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 object-contain rounded-lg"/>) : (<div className="w-32 h-32 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
                          <QrCode className="w-14 h-14" style={{ color: '#0f172a' }}/>
                        </div>)}
                      <div className="absolute inset-0 m-auto w-8 h-8 rounded-full shadow-md overflow-hidden flex items-center justify-center pointer-events-none" style={{ backgroundColor: '#247040', border: '2px solid #ffffff', color: '#ffffff' }}>
                        {!qrImgError && isValidImageUrl(data.visitorPhoto || data.photo || data.avatar || data.photoUrl) ? (<img src={resolvePhotoUrl(data.visitorPhoto || data.photo || data.avatar || data.photoUrl)} alt={data.visitorName} className="w-full h-full object-cover" onError={() => setQrImgError(true)}/>) : (<span className="font-extrabold text-[10px] text-white">
                            {getInitials(data.visitorName)}
                          </span>)}
                      </div>
                    </div>
                    <div style={{ color: '#166534', fontWeight: 800, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px' }}>
                      {t('visitorPass.clickToEnlarge')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Pin */}
              <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid #e2e8f0', color: '#334155', fontWeight: 700, fontSize: '10px', backgroundColor: '#f8fafc' }}>
                {t('visitorPass.returnWhenLeaving')}
              </div>
            </div>
          </div>

          {/* Right: All Details Sections */}
          <div className="col-12 col-lg-7">
            <div className="p-4 space-y-5">

              {/* ── SECTION 1: Appointment Details (ONE CARD) ── */}
              <div>
                <div style={sectionLabel}>
                  <Calendar className="inline-block h-3.5 w-3.5 mr-1.5" style={{ color: '#60a5fa' }}/>
                  {t('visitorPass.apptDetails')}
                </div>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                  {/* Row */}
                  <div className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(96, 165, 250, 0.12)' }}>
                      <FileText className="h-4 w-4" style={{ color: '#60a5fa' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.apptTitle')}</div>
                      <div style={{ ...fieldValue, fontSize: '14px', color: '#ffffff', marginTop: '2px' }}>{data.appointmentTitle}</div>
                      <div className="font-mono mt-0.5" style={{ color: '#64748b', fontSize: '10px' }}>ID: {data.appointmentId}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(96, 165, 250, 0.12)' }}>
                      <User className="h-4 w-4" style={{ color: '#60a5fa' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.hostEmployee')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.hostName}</div>
                      {data.hostDepartment && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '1px' }}>{data.hostDepartment}</div>}
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(52, 211, 153, 0.12)' }}>
                      <ShieldCheck className="h-4 w-4" style={{ color: '#34d399' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.accessPoint')}</div>
                      <div style={{ ...fieldValue, color: '#34d399', marginTop: '2px' }}>{data.accessPoint}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.12)' }}>
                      <MapPin className="h-4 w-4" style={{ color: '#fbbf24' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.location')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.location}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(167, 139, 250, 0.12)' }}>
                      <Briefcase className="h-4 w-4" style={{ color: '#a78bfa' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.purpose')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.purpose}</div>
                    </div>
                  </div>
                  {/* Row - Validity */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'rgba(6, 78, 59, 0.25)' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                      <Clock className="h-4 w-4" style={{ color: '#34d399' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.validPeriod')}</div>
                      <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{data.date} • {data.time}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: Registration & Identity (ONE CARD) ── */}
              <div>
                <div style={sectionLabel}>
                  <CreditCard className="inline-block h-3.5 w-3.5 mr-1.5" style={{ color: '#f472b6' }}/>
                  {t('visitorPass.regIdentity')}
                </div>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(96, 165, 250, 0.12)' }}>
                      <Mail className="h-4 w-4" style={{ color: '#60a5fa' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('table.email')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.email}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(52, 211, 153, 0.12)' }}>
                      <Phone className="h-4 w-4" style={{ color: '#34d399' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('table.phone')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.phone}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.12)' }}>
                      <Building className="h-4 w-4" style={{ color: '#fbbf24' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.companyOrg')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.company}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 146, 60, 0.12)' }}>
                      <MapPin className="h-4 w-4" style={{ color: '#fb923c' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.branch')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.branch}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(167, 139, 250, 0.12)' }}>
                      <Hash className="h-4 w-4" style={{ color: '#a78bfa' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{data.identityType}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.identityNumber}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(244, 114, 182, 0.12)' }}>
                      <CreditCard className="h-4 w-4" style={{ color: '#f472b6' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.passNumber')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.passNumber}</div>
                    </div>
                  </div>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #293548' }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(96, 165, 250, 0.12)' }}>
                      <Calendar className="h-4 w-4" style={{ color: '#60a5fa' }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.registeredOn')}</div>
                      <div style={{ ...fieldValue, marginTop: '2px' }}>{data.registeredOn}</div>
                    </div>
                  </div>
                  {/* Row - Verification */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: (() => {
                    const st = data.normalizedStatus || 'PENDING';
                    if (st === 'APPROVED' || st === 'CHECKED IN') return 'rgba(6, 78, 59, 0.25)';
                    if (st === 'COMPLETED') return 'rgba(30, 58, 138, 0.25)';
                    if (st === 'RESCHEDULED') return 'rgba(88, 28, 135, 0.25)';
                    if (st === 'CANCELLED' || st === 'REJECTED') return 'rgba(136, 19, 55, 0.25)';
                    return 'rgba(120, 53, 15, 0.25)';
                  })() }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                      <CheckCircle2 className="h-4 w-4" style={{ color: (() => {
                        const st = data.normalizedStatus || 'PENDING';
                        if (st === 'APPROVED') return '#34d399';
                        if (st === 'CHECKED IN') return '#2dd4bf';
                        if (st === 'COMPLETED') return '#60a5fa';
                        if (st === 'RESCHEDULED') return '#c084fc';
                        if (st === 'CANCELLED' || st === 'REJECTED') return '#f87171';
                        return '#fbbf24';
                      })() }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={fieldLabel}>{t('visitorPass.verificationStatus')}</div>
                      <span className="px-2.5 py-0.5 rounded-full inline-block mt-1 font-black text-[11px]" style={(() => {
                        const st = data.normalizedStatus || 'PENDING';
                        if (st === 'APPROVED') return { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid #059669' };
                        if (st === 'CHECKED IN') return { backgroundColor: 'rgba(20, 184, 166, 0.2)', color: '#5eead4', border: '1px solid #0d9488' };
                        if (st === 'COMPLETED') return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid #2563eb' };
                        if (st === 'RESCHEDULED') return { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid #9333ea' };
                        if (st === 'CANCELLED' || st === 'REJECTED') return { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid #dc2626' };
                        return { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid #d97706' };
                      })()}>{data.verificationStatus}</span>
                    </div>
                  </div>
                </div>
              </div>


              {/* ── ACTION BUTTONS ── */}
              <div className="no-print" style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                <div className="row g-2">
                  <div className="col-4">
                    <button onClick={() => {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = `Visitor_Pass_${data.visitorId}.png`;
            link.click();
        }} className="w-full rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 800, fontSize: '11px', padding: '10px 8px', border: 'none' }}>
                      <Download className="h-4 w-4"/> {t('visitorPass.downloadQR')}
                    </button>
                  </div>
                  <div className="col-4">
                    <button onClick={handlePrint} className="w-full rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 700, fontSize: '11px', padding: '10px 8px', border: '1px solid #334155' }}>
                      <Printer className="h-4 w-4" style={{ color: '#34d399' }}/> {t('visitorPass.printPass')}
                    </button>
                  </div>
                  <div className="col-4">
                    <button onClick={() => {
            const shareUrl = window.location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    const btn = document.getElementById('share-link-btn');
                    if (btn) {
                        btn.textContent = '✓ Link Copied!';
                        setTimeout(() => { btn.textContent = ''; }, 2000);
                    }
                }).catch(() => {
                    // Fallback for older browsers
                    const input = document.createElement('input');
                    input.value = shareUrl;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                    alert('Pass link copied to clipboard!');
                });
            }
            else {
                // Fallback
                const input = document.createElement('input');
                input.value = shareUrl;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                alert('Pass link copied to clipboard!');
            }
        }} id="share-link-btn" className="w-full rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ backgroundColor: '#0f172a', color: '#cbd5e1', fontWeight: 700, fontSize: '11px', padding: '10px 8px', border: '1px solid #1e293b' }}>
                      <Share2 className="h-4 w-4" style={{ color: '#a78bfa' }}/> Share Link
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FULLSCREEN ENLARGED QR MODAL                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {qrModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(2, 6, 23, 0.88)', backdropFilter: 'blur(12px)' }}>
          <div className="rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl relative" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            {/* Close Button */}
            <button onClick={() => setQrModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer" style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none' }}>
              <X size={20}/>
            </button>

            {/* Title & Subtitle */}
            <div style={{ marginBottom: '16px', paddingTop: '4px' }}>
              <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.025em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Visitor Entry QR Code
              </div>
              <div style={{ color: '#475569', fontWeight: 700, fontSize: '12px' }}>
                {data.visitorName} ({data.visitorId})
              </div>
            </div>

            {/* Enlarged QR Code */}
            <div className="relative inline-block p-3.5 rounded-3xl shadow-xl" style={{ backgroundColor: '#ffffff', border: '2px solid #247040' }}>
              {qrCodeUrl ? (<img src={qrCodeUrl} alt="Enlarged QR Code" className="w-64 h-64 object-contain rounded-xl"/>) : (<div className="w-64 h-64 flex items-center justify-center rounded-xl" style={{ backgroundColor: '#f1f5f9' }}>
                  <QrCode className="w-24 h-24" style={{ color: '#0f172a' }}/>
                </div>)}
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full shadow-lg overflow-hidden flex items-center justify-center pointer-events-none" style={{ backgroundColor: '#247040', color: '#ffffff', border: '2px solid #ffffff' }}>
                {isValidImageUrl(data.visitorPhoto || data.photo || data.avatar || data.photoUrl) ? (<img src={resolvePhotoUrl(data.visitorPhoto || data.photo || data.avatar || data.photoUrl)} alt={data.visitorName} className="w-full h-full object-cover"/>) : (<User className="w-7 h-7 text-white"/>)}
              </div>
            </div>

            {/* Scan Instruction */}
            <div className="text-center rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 800, fontSize: '12px', padding: '8px 12px', marginTop: '16px' }}>
              Scan at Gate / Reception Scanner
            </div>

            {/* Download Button */}
            <button onClick={() => {
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `Visitor_Pass_${data.visitorId}.png`;
                link.click();
            }} className="w-full rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer" style={{ backgroundColor: '#247040', color: '#ffffff', fontWeight: 800, fontSize: '12px', padding: '12px', marginTop: '12px', border: 'none' }}>
              <Download size={16}/> Download QR Code Image
            </button>
          </div>
        </div>)}
    </div>);
}
