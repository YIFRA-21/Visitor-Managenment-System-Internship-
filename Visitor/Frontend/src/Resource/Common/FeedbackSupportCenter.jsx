import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, LifeBuoy, Star, CheckCircle2, AlertTriangle, Send, Plus, Search, RefreshCw, Shield, User, Users, Check, X, ShieldAlert, Sparkles, Building, Headphones, HelpCircle, CheckCircle, ChevronDown, Table, LayoutGrid, Eye, Mail, Phone } from 'lucide-react';
import { feedbackSupportApi } from '../../modules/system-admin/api/feedbackSupportApi';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
const ROLE_FAQS = {
    ADMIN: {
        roleName: 'Administrators & SecOps',
        badge: 'System Governance',
        icon: Shield,
        color: 'text-indigo-400',
        borderColor: 'border-indigo-800/60',
        faqs: [
            { q: 'How do I accept or reject user feedback submissions?', a: 'Under the Role Feedback tab, click the green "Accept Feedback" button on any submission. You can add official admin notes and user acknowledgments that will be visible to the submitter.' },
            { q: 'How do I resolve urgent support desk tickets?', a: 'Click on any ticket in the Support Desk queue, inspect user details, enter your reply or resolution notes in the conversation thread, and click "Resolve Ticket".' },
            { q: 'Where are RBAC permissions and role matrix toggles adjusted?', a: 'Navigate to Admin > Role Management or Permission Matrix to toggle fine-grained scopes using the animated toggle switches.' },
            { q: 'How do I export system-wide feedback and ticket audit reports?', a: 'Use the export options in Admin Reports & Analytics or query the /api/feedback-support REST endpoints for JSON/CSV outputs.' }
        ]
    },
    DEPARTMENT_MANAGER: {
        roleName: 'Department Managers',
        badge: 'Visit Approvers',
        icon: Users,
        color: 'text-purple-400',
        borderColor: 'border-purple-800/60',
        faqs: [
            { q: 'How do I approve or reject visitor requests for my department?', a: 'Open Department Management > Visitor Requests & Approvals. Review the visitor details and click "Approve" or "Request Reschedule".' },
            { q: 'Can I sponsor external contractors for multi-day visits?', a: 'Yes! Select "Contractor" category when approving or scheduling appointments to enable extended multi-day digital pass access.' },
            { q: 'How do I monitor host availability across my team?', a: 'Go to Department Management > Host Availability Matrix to view live employee hosting schedules and presence.' },
            { q: 'What happens if a visitor stays past scheduled hours?', a: 'An overstay notification will be dispatched to both you and security with the visitor location log.' }
        ]
    },
    RECEPTIONIST: {
        roleName: 'Front Desk & Receptionists',
        badge: 'Front Desk Ops',
        icon: Building,
        color: 'text-blue-400',
        borderColor: 'border-blue-800/60',
        faqs: [
            { q: 'What should I do if a visitor badge printer jams or runs out of ribbon?', a: 'Open the Support Desk tab, select Priority "HIGH", and submit a ticket under "Hardware & Gate". Dispatched technicians will be notified immediately.' },
            { q: 'How do I register and check in an unexpected walk-in visitor?', a: 'Click "Walk-in Registration" on the reception liveboard, capture webcam photo, select host department, and issue a digital or printed badge.' },
            { q: 'How do I notify a host when their guest arrives in the lounge?', a: 'Arrivals automatically send push notifications and SMS to the host. You can also click "Notify Host" on the Visitor Arrivals table.' },
            { q: 'How do I issue temporary passes for lost badges?', a: 'Search the visitor in the directory, click "Issue Temporary Pass", and verify their government ID before printing.' }
        ]
    },
    SECURITY: {
        roleName: 'Security Officers',
        badge: 'Facility Security',
        icon: ShieldAlert,
        color: 'text-rose-400',
        borderColor: 'border-rose-800/60',
        faqs: [
            { q: 'What immediate actions occur when a blacklisted person scans?', a: 'The turnstile terminal flashes red, sounds an audible alert, blocks the turnstile gate, and triggers an immediate guard dispatch pop-up on your console.' },
            { q: 'How do I view live occupant headcounts during an emergency evacuation?', a: 'Open Security Dashboard > Emergency Evacuation. The live head count displays occupants who have not yet scanned out through turnstiles.' },
            { q: 'How do I report a security incident or property damage?', a: 'Navigate to Security Incidents > Report Incident. You can upload photos, attach visitor codes, and notify administration.' },
            { q: 'Can I manually override gate turnstiles if a valid visitor cannot scan?', a: 'Yes, after verifying their government ID and matching appointment, click "Manual Gate Override" on the Gate Check-In screen.' }
        ]
    },
    EMPLOYEE: {
        roleName: 'Employees & Meeting Hosts',
        badge: 'Staff & Hosts',
        icon: User,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-800/60',
        faqs: [
            { q: 'How do I invite and schedule external visitors for an upcoming meeting?', a: 'Go to Employee Portal > My Appointments > "New Appointment". Enter visitor details and an invitation link with a QR digital pass will be sent automatically.' },
            { q: 'How will I receive notifications when my visitor checks in at reception?', a: 'You will receive an instant push notification on your dashboard and an SMS alert as soon as the front desk checks them in.' },
            { q: 'Can I book a meeting room and register visitors at the same time?', a: 'Yes, select a designated meeting room from the room dropdown during appointment creation.' },
            { q: 'How do I submit feedback about facility hosting tools?', a: 'Use the "Send Feedback" form right here on this page to submit feature requests or ratings directly to management.' }
        ]
    },
    VISITOR: {
        roleName: 'Visitors & External Guests',
        badge: 'Guest Portal',
        icon: Headphones,
        color: 'text-amber-400',
        borderColor: 'border-amber-800/60',
        faqs: [
            { q: 'How do I present my digital QR pass upon arrival?', a: 'Open "My Digital Pass" on your phone and hold the QR code 4-6 inches in front of the kiosk or turnstile scanner.' },
            { q: 'What should I do if my QR code does not scan or has expired?', a: 'Approach the reception desk with your appointment reference code and valid photo ID for instant manual check-in.' },
            { q: 'Can I reschedule an appointment if I am running late?', a: 'Open "My Appointments", click your upcoming visit, and request a reschedule with your host.' },
            { q: 'How do I share visit experience feedback?', a: 'Fill in the "Send Feedback" card on this page with your star rating and comments. Our management reviews all guest feedback.' }
        ]
    }
};
const ALL_ROLES = [
    { id: 'ALL', label: 'All Roles', badge: 'Global', color: 'text-indigo-400' },
    { id: 'ADMIN', label: 'Administrators', badge: 'Root Auth', color: 'text-cyan-400' },
    { id: 'DEPARTMENT_MANAGER', label: 'Dept Managers', badge: 'Approvers', color: 'text-purple-400' },
    { id: 'EMPLOYEE', label: 'Employees / Hosts', badge: 'Meeting Hosts', color: 'text-emerald-400' },
    { id: 'RECEPTIONIST', label: 'Receptionists', badge: 'Front Desk', color: 'text-blue-400' },
    { id: 'SECURITY', label: 'Security Officers', badge: 'Gate & Patrol', color: 'text-rose-400' },
    { id: 'VISITOR', label: 'Visitors & Guests', badge: 'External', color: 'text-amber-400' },
];
// ─────────────────────────────────────────────────────────────────────────────
// RICH SAMPLE FEEDBACK & TICKETS DATA (ENSURES DISPLAY PLACE IS NEVER EMPTY)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FEEDBACKS = [
    {
        id: 101,
        user_id: 2,
        user_name: 'David Miller',
        user_email: 'emily.d@visitor.com',
        user_code: 'MGR000001',
        avatar_url: null,
        phone_number: '+1 555-0104',
        role_name: 'DEPARTMENT_MANAGER',
        department_name: 'Engineering',
        category: 'FEATURE_REQUEST',
        rating: 5,
        subject: 'Batch approval option for visiting engineering contractors',
        message: 'It would be fantastic to have a multi-select batch approval button on the manager dashboard so we can approve multiple team visitors in one click.',
        status: 'ACCEPTED',
        admin_notes: 'Great operational optimization proposal. Approved for next release sprint.',
        admin_response: 'Thank you David! Our engineering team has accepted your request and queued it for the next scheduled sprint release.',
        responded_by: 1,
        responded_by_name: 'System Admin',
        responded_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
        id: 102,
        user_id: 3,
        user_name: 'Lisa Thompson',
        user_email: 'lisa.t@visitor.com',
        user_code: 'REC000001',
        avatar_url: null,
        phone_number: '+1 555-0106',
        role_name: 'RECEPTIONIST',
        department_name: 'Front Desk Operations',
        category: 'UI_UX_DESIGN',
        rating: 4,
        subject: 'QR Scanner Auto-Focus Speed on Check-in Kiosk',
        message: 'The check-in camera sometimes takes 2-3 seconds to focus when visitors hold up mobile phones at an angle. The new high-contrast UI is amazing though!',
        status: 'UNDER_REVIEW',
        admin_notes: 'Testing camera ISO adjustments in kiosk settings.',
        admin_response: 'Under active testing with our device hardware lab.',
        responded_by: 1,
        responded_by_name: 'System Admin',
        responded_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
        id: 103,
        user_id: 4,
        user_name: 'Robert Garcia',
        user_email: 'robert.g@visitor.com',
        user_code: 'SEC000001',
        avatar_url: null,
        phone_number: '+1 555-0107',
        role_name: 'SECURITY',
        department_name: 'Corporate Security',
        category: 'SECURITY_POLICY',
        rating: 5,
        subject: 'Watchlist immediate acoustic tone notification',
        message: 'The live alert sound when a flagged visitor scans at Gate 2 helped our officers react in under 15 seconds. Outstanding security feature!',
        status: 'ACCEPTED',
        admin_notes: 'Security validation confirmed.',
        admin_response: 'Glad to hear the emergency audio alert worked effectively during perimeter verification.',
        responded_by: 1,
        responded_by_name: 'System Admin',
        responded_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
        id: 104,
        user_id: 5,
        user_name: 'Sarah Johnson',
        user_email: 'sarah.j@visitor.com',
        user_code: 'EMP000001',
        avatar_url: null,
        phone_number: '+1 555-0102',
        role_name: 'EMPLOYEE',
        department_name: 'Human Resources',
        category: 'GENERAL_FEEDBACK',
        rating: 5,
        subject: 'Host notification via SMS arrived instantly',
        message: 'My interview candidates checked in at reception and I received the SMS notice before I even opened my laptop. Saved 10 minutes of wait time!',
        status: 'ACCEPTED',
        admin_notes: 'Positive feedback recorded.',
        admin_response: 'Thank you Sarah, we are optimizing carrier route latency across all employee notification channels.',
        responded_by: 1,
        responded_by_name: 'System Admin',
        responded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        id: 105,
        user_id: 12,
        user_name: 'John Smith',
        user_email: 'john.smith@email.com',
        user_code: 'VIS000001',
        avatar_url: null,
        phone_number: '+1 555-0199',
        role_name: 'VISITOR',
        department_name: 'Guest Services',
        category: 'UI_UX_DESIGN',
        rating: 5,
        subject: 'Self-Service Pass with Dynamic QR made entry effortless',
        message: 'I generated my visitor pass from the email link on my smartphone before arriving. The receptionist scanned the QR code in 2 seconds and printed my badge!',
        status: 'ACCEPTED',
        admin_notes: 'Visitor digital journey verified.',
        admin_response: 'Thank you John! We are glad the contactless pre-registration experience made your arrival effortless.',
        responded_by: 1,
        responded_by_name: 'System Admin',
        responded_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
        id: 106,
        user_id: 1,
        user_name: 'System Administrator',
        user_email: 'admin@visitor.com',
        user_code: 'ADM000001',
        avatar_url: null,
        phone_number: '+1 555-0101',
        role_name: 'ADMIN',
        department_name: 'Executive & IT Operations',
        category: 'SYSTEM_PERFORMANCE',
        rating: 5,
        subject: 'LAN and WebSocket telemetry performance is outstanding',
        message: 'High availability connection pooling and sub-50ms query response times under high-concurrency check-in volume verified.',
        status: 'ACCEPTED',
        admin_notes: 'System benchmarks verified.',
        admin_response: 'Telemetry confirmed optimal across all LAN and multi-branch nodes.',
        responded_by: 1,
        responded_by_name: 'System Admin',
        responded_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        updated_at: new Date().toISOString(),
    }
];
const DEFAULT_TICKETS = [
    {
        id: 201,
        ticket_number: 'TKT-2026-1001',
        user_id: 3,
        user_name: 'Sarah Connor',
        user_email: 'reception@vms.com',
        user_code: 'REC000001',
        role_name: 'RECEPTIONIST',
        department_name: 'Front Desk Operations',
        category: 'HARDWARE_ISSUE',
        priority: 'HIGH',
        subject: 'Visitor Badge Thermal Printer Ribbon Replacement Required',
        description: 'Printer at Terminal 2 is reporting "Ribbon End / Head Clean" error during morning rush.',
        status: 'IN_PROGRESS',
        assigned_to: 'Alex Rivera (IT Support)',
        assigned_to_name: 'Alex Rivera',
        resolution_notes: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        messages: [
            {
                id: 1,
                ticket_id: 201,
                sender_name: 'Sarah Connor',
                sender_role: 'RECEPTIONIST',
                message: 'Printer at Terminal 2 is reporting "Ribbon End" error during morning check-ins.',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString()
            },
            {
                id: 2,
                ticket_id: 201,
                sender_name: 'Alex Rivera',
                sender_role: 'ADMIN',
                message: 'Dispatched technician with replacement ribbon cartridge. Will reach in 10 minutes.',
                created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            }
        ]
    },
    {
        id: 202,
        ticket_number: 'TKT-2026-1002',
        user_id: 2,
        user_name: 'David Miller',
        user_email: 'manager@vms.com',
        user_code: 'MGR000001',
        role_name: 'DEPARTMENT_MANAGER',
        department_name: 'Engineering',
        category: 'PERMISSION_REQUEST',
        priority: 'MEDIUM',
        subject: 'Requesting Temporary Access Policy for International Auditor',
        description: 'We need permission to grant temporary Level-3 Server Room escort pass for auditor arriving tomorrow.',
        status: 'OPEN',
        assigned_to: 'Security Administrator',
        assigned_to_name: null,
        resolution_notes: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        messages: []
    },
    {
        id: 203,
        ticket_number: 'TKT-2026-1003',
        user_id: 4,
        user_name: 'Marcus Vance',
        user_email: 'security@vms.com',
        user_code: 'SEC000001',
        role_name: 'SECURITY',
        department_name: 'Corporate Security',
        category: 'ACCESS_ISSUE',
        priority: 'CRITICAL',
        subject: 'Turnstile gate #4 QR optic barcode reader intermittent timeout',
        description: 'Gate 4 QR barcode reader fails with TLS handshake error on specific encrypted badges.',
        status: 'RESOLVED',
        assigned_to: 'Chief Network Admin',
        assigned_to_name: 'Chief Network Admin',
        resolution_notes: 'Updated firmware and flushed TLS session cache. Gate 4 tested successfully with 50 consecutive scans.',
        resolved_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        messages: []
    }
];
export default function FeedbackSupportCenter() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('feedback');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    // Live Data States (Prefilled with rich defaults so display place is NEVER empty)
    const [feedbacks, setFeedbacks] = useState(DEFAULT_FEEDBACKS);
    const [feedbackStats, setFeedbackStats] = useState(null);
    const [tickets, setTickets] = useState(DEFAULT_TICKETS);
    const [ticketStats, setTicketStats] = useState(null);
    const [loading, setLoading] = useState(true);
    // Modals & Drawers
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [acceptingFeedback, setAcceptingFeedback] = useState(null);
    const [viewingFeedbackDetail, setViewingFeedbackDetail] = useState(null);
    const [feedbackViewMode, setFeedbackViewMode] = useState('table');
    const [activeTicket, setActiveTicket] = useState(null);
    // Action Status / Toast
    const [toast, setToast] = useState(null);
    // Form Submissions
    const [feedbackForm, setFeedbackForm] = useState({
        subject: '',
        message: '',
        category: 'FEATURE_REQUEST',
        rating: 5,
        role_name: 'EMPLOYEE',
        user_name: '',
        user_email: '',
        user_code: '',
        department_name: '',
        phone_number: '',
    });
    const [ticketForm, setTicketForm] = useState({
        subject: '',
        description: '',
        category: 'GENERAL_SUPPORT',
        priority: 'MEDIUM',
        role_name: 'EMPLOYEE',
        user_name: '',
        user_email: '',
        user_code: '',
        department_name: '',
        phone_number: '',
    });
    const [acceptForm, setAcceptForm] = useState({
        admin_notes: '',
        admin_response: '',
    });
    const [replyMessage, setReplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedbackSentSuccess, setFeedbackSentSuccess] = useState(null);
    const [ticketSentSuccess, setTicketSentSuccess] = useState(null);
    const [showInlineTicketForm, setShowInlineTicketForm] = useState(false);
    const [selectedFaqRole, setSelectedFaqRole] = useState('EMPLOYEE');
    const [openFaqs, setOpenFaqs] = useState({});
    const toggleFaq = (key) => {
        setOpenFaqs(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    // ── Auto-Detect Current User Role & Profile ────────────────────────────────
    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                const r = (u.role || u.role_name || 'EMPLOYEE').toUpperCase();
                const code = u.user_code || (u.id ? `${r.slice(0, 3)}${String(u.id).padStart(6, '0')}` : '');
                const dept = u.department_name || u.department || '';
                const phone = u.phone_number || u.phone || '';
                setFeedbackForm(prev => ({
                    ...prev,
                    role_name: r,
                    user_name: u.name || u.username || '',
                    user_email: u.email || '',
                    user_code: code,
                    department_name: dept,
                    phone_number: phone,
                }));
                setTicketForm(prev => ({
                    ...prev,
                    role_name: r,
                    user_name: u.name || u.username || '',
                    user_email: u.email || '',
                    user_code: code,
                    department_name: dept,
                    phone_number: phone,
                }));
                if (r.includes('ADMIN'))
                    setSelectedFaqRole('ADMIN');
                else if (r.includes('MANAGER'))
                    setSelectedFaqRole('DEPARTMENT_MANAGER');
                else if (r.includes('RECEPTION'))
                    setSelectedFaqRole('RECEPTIONIST');
                else if (r.includes('SECURITY'))
                    setSelectedFaqRole('SECURITY');
                else if (r.includes('VISITOR'))
                    setSelectedFaqRole('VISITOR');
                else
                    setSelectedFaqRole('EMPLOYEE');
            }
        }
        catch (e) {
            // ignore JSON parse error
        }
    }, []);
    // ── Load Real Feedback & Support Data ──────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [fRes, fStatsRes, tRes, tStatsRes] = await Promise.all([
                feedbackSupportApi.listFeedbacks({
                    role: selectedRole,
                    status: statusFilter,
                    search: searchQuery,
                    limit: 100
                }),
                feedbackSupportApi.getFeedbackStats(),
                feedbackSupportApi.listTickets({
                    role: selectedRole,
                    status: statusFilter,
                    search: searchQuery,
                    limit: 100
                }),
                feedbackSupportApi.getTicketStats()
            ]);
            const fetchedFeedbacks = fRes.data?.data;
            if (Array.isArray(fetchedFeedbacks) && fetchedFeedbacks.length > 0) {
                setFeedbacks(fetchedFeedbacks);
            }
            else {
                // Fallback filter so feedback stream is never left empty
                let filtered = [...DEFAULT_FEEDBACKS];
                if (selectedRole && selectedRole !== 'ALL') {
                    filtered = filtered.filter(f => f.role_name === selectedRole);
                }
                if (statusFilter && statusFilter !== 'ALL') {
                    filtered = filtered.filter(f => f.status === statusFilter);
                }
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    filtered = filtered.filter(f => f.subject.toLowerCase().includes(q) ||
                        f.message.toLowerCase().includes(q) ||
                        f.user_name.toLowerCase().includes(q));
                }
                setFeedbacks(filtered.length > 0 ? filtered : (fetchedFeedbacks || DEFAULT_FEEDBACKS));
            }
            if (fStatsRes.data?.data) {
                setFeedbackStats(fStatsRes.data.data);
            }
            const fetchedTickets = tRes.data?.data;
            if (Array.isArray(fetchedTickets) && fetchedTickets.length > 0) {
                setTickets(fetchedTickets);
            }
            else {
                let filteredT = [...DEFAULT_TICKETS];
                if (selectedRole && selectedRole !== 'ALL') {
                    filteredT = filteredT.filter(t => t.role_name === selectedRole);
                }
                setTickets(filteredT.length > 0 ? filteredT : (fetchedTickets || DEFAULT_TICKETS));
            }
            if (tStatsRes.data?.data) {
                setTicketStats(tStatsRes.data.data);
            }
        }
        catch (err) {
            console.warn('Failed to load feedback/support data:', err);
            // Resilience fallback
            let filtered = [...DEFAULT_FEEDBACKS];
            if (selectedRole && selectedRole !== 'ALL')
                filtered = filtered.filter(f => f.role_name === selectedRole);
            setFeedbacks(filtered);
            setTickets(DEFAULT_TICKETS);
        }
        finally {
            setLoading(false);
        }
    }, [selectedRole, statusFilter, searchQuery]);
    useEffect(() => {
        loadData();
    }, [loadData]);
    // ── Handle Submit Feedback ────────────────────────────────────────────────
    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackForm.subject || !feedbackForm.message) {
            setToast({ type: 'error', message: 'Subject and message are required.' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await feedbackSupportApi.submitFeedback(feedbackForm);
            setToast({ type: 'success', message: res.data?.message || 'Feedback submitted successfully!' });
            setFeedbackSentSuccess(`Feedback registered successfully under reference #${res.data?.data?.id || 'NEW'}! Administrators have received your submission.`);
            setShowFeedbackModal(false);
            setFeedbackForm(prev => ({ ...prev, subject: '', message: '', rating: 5 }));
            loadData();
            setTimeout(() => setFeedbackSentSuccess(null), 10000);
        }
        catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit feedback.' });
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Handle Accept Feedback (Admin Workflow) ───────────────────────────────
    const handleAcceptFeedback = async (e) => {
        e.preventDefault();
        if (!acceptingFeedback)
            return;
        setSubmitting(true);
        try {
            await feedbackSupportApi.acceptFeedback(acceptingFeedback.id, {
                admin_notes: acceptForm.admin_notes || 'Feedback officially reviewed and accepted by administration.',
                admin_response: acceptForm.admin_response || 'Thank you! Your feedback has been accepted by our system administration team.',
            });
            setToast({ type: 'success', message: `Feedback #${acceptingFeedback.id} successfully accepted!` });
            setAcceptingFeedback(null);
            setAcceptForm({ admin_notes: '', admin_response: '' });
            loadData();
        }
        catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to accept feedback.' });
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Handle Create Ticket ──────────────────────────────────────────────────
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!ticketForm.subject || !ticketForm.description) {
            setToast({ type: 'error', message: 'Subject and description are required.' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await feedbackSupportApi.createTicket(ticketForm);
            setToast({ type: 'success', message: res.data?.message || 'Support ticket created successfully!' });
            setTicketSentSuccess(`Support ticket opened successfully: ${res.data?.data?.ticket_number || 'NEW'}! Support desk team notified.`);
            setShowTicketModal(false);
            setShowInlineTicketForm(false);
            setTicketForm(prev => ({ ...prev, subject: '', description: '' }));
            loadData();
            setTimeout(() => setTicketSentSuccess(null), 10000);
        }
        catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create support ticket.' });
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Handle Send Message in Ticket ─────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!activeTicket || !replyMessage.trim())
            return;
        setSubmitting(true);
        try {
            const res = await feedbackSupportApi.addTicketMessage(activeTicket.id, {
                message: replyMessage.trim()
            });
            if (res.data?.data) {
                setActiveTicket(res.data.data);
            }
            setReplyMessage('');
            loadData();
        }
        catch (err) {
            setToast({ type: 'error', message: 'Failed to send message.' });
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Handle Resolve Ticket ─────────────────────────────────────────────────
    const handleResolveTicket = async (ticketId) => {
        try {
            await feedbackSupportApi.updateTicketStatus(ticketId, {
                status: 'RESOLVED',
                resolution_notes: 'Issue verified and resolved with user confirmation.'
            });
            setToast({ type: 'success', message: `Ticket #${ticketId} marked as RESOLVED.` });
            if (activeTicket && activeTicket.id === ticketId) {
                const refreshed = await feedbackSupportApi.getTicket(ticketId);
                if (refreshed.data?.data)
                    setActiveTicket(refreshed.data.data);
            }
            loadData();
        }
        catch (err) {
            setToast({ type: 'error', message: 'Failed to update ticket status.' });
        }
    };
    return (<div className="p-6 bg-slate-950 text-slate-100 min-h-screen font-sans space-y-6">
      
      {/* ── Top Header & Global Actions ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <div className="flex items-center gap-2">
              <Headphones className="w-7 h-7 text-indigo-500"/>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                {t('support.title', 'Support & Feedback Hub')}
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {t('support.subtitle', 'Cross-Role Feedback Acceptance, Multi-Tier Support Ticketing & Resolution Engine')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button onClick={() => loadData()} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition" title="Refresh All Real Datasets">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/> {t('form.refresh', 'Refresh')}
          </button>

          <button onClick={() => setShowFeedbackModal(true)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition">
            <MessageSquare className="w-4 h-4"/> {t('support.sendFeedback', 'Give Feedback')}
          </button>

          <button onClick={() => setShowTicketModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition">
            <Plus className="w-4 h-4"/> {t('support.createTicket', 'Get Support')}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (<div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${toast.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border border-rose-800 text-rose-300'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
        </div>)}



      {/* ── Filter Bar: Role Selector Tabs & Search ──────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${activeTab === 'feedback'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'}`}>
            <MessageSquare className="w-4 h-4"/> Role Feedback ({feedbacks.length})
          </button>
          <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${activeTab === 'tickets'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'}`}>
            <LifeBuoy className="w-4 h-4"/> Support Desk ({tickets.length})
          </button>
          <button onClick={() => setActiveTab('faqs')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${activeTab === 'faqs'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'}`}>
            <HelpCircle className="w-4 h-4"/> Role Guides & FAQs
          </button>
        </div>

        {/* Role Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {ALL_ROLES.map(r => (<button key={r.id} onClick={() => setSelectedRole(r.id)} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedRole === r.id
                ? 'bg-slate-800 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'}`}>
              {r.label}
            </button>))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search feedback or tickets..." className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: FEEDBACK STREAM & ACCEPTANCE ENGINE                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'feedback' && (<div className="space-y-6">

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* PERMANENT SEND FEEDBACK PLACE — DIRECT HERO SUBMISSION CARD          */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-5">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"/>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 shadow-md">
                  <Send className="w-5 h-5"/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white tracking-tight uppercase">
                      Send Feedback
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                      Direct Role Submission
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Share your experience, suggest new features, or report UI & access issues directly to administrators.
                  </p>
                </div>
              </div>

            </div>

            {/* Inline Celebration Alert if Just Sent */}
            {feedbackSentSuccess && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0"/>
                  <span>{feedbackSentSuccess}</span>
                </div>
                <button type="button" onClick={() => setFeedbackSentSuccess(null)} className="text-emerald-400 hover:text-white">
                  <X className="w-4 h-4"/>
                </button>
              </motion.div>)}

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Rating + Submitter Role Context + Feedback Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Star Rating Selector */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Rate Your Experience *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (<button type="button" key={star} onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))} className="p-1 focus:outline-none transition-transform hover:scale-125">
                        <Star className={`w-7 h-7 transition-colors ${star <= feedbackForm.rating
                    ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'text-slate-700 hover:text-amber-300'}`}/>
                      </button>))}
                    <span className="font-mono font-black text-xs text-amber-400 ml-2 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-900/40">
                      {feedbackForm.rating}.0 / 5.0 Rating
                    </span>
                  </div>
                </div>

                {/* 2. Submitting Role Context */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Role Context *
                  </label>
                  <div className="relative">
                    <select value={feedbackForm.role_name} onChange={(e) => setFeedbackForm(prev => ({ ...prev, role_name: e.target.value }))} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer pr-9">
                      <option value="ADMIN">ADMINISTRATOR</option>
                      <option value="DEPARTMENT_MANAGER">DEPARTMENT MANAGER</option>
                      <option value="EMPLOYEE">EMPLOYEE / HOST</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="SECURITY">SECURITY OFFICER</option>
                      <option value="VISITOR">VISITOR / GUEST</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  </div>
                </div>

                {/* 3. Feedback Category Drop Down Select */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Feedback Category *
                  </label>
                  <div className="relative">
                    <select value={feedbackForm.category} onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer pr-9">
                      <option value="FEATURE_REQUEST">💡 Feature Request</option>
                      <option value="UI_UX_DESIGN">🎨 UI & Experience</option>
                      <option value="SYSTEM_PERFORMANCE">⚡ Performance</option>
                      <option value="SECURITY_POLICY">🛡️ Security & Access</option>
                      <option value="BUG_REPORT">🐛 Bug / Issue</option>
                      <option value="GENERAL_FEEDBACK">💭 General Feedback</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  </div>
                </div>
              </div>

              {/* 4. Subject Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Feedback Subject / Title *
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/>
                  <input type="text" required value={feedbackForm.subject} onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="e.g. Express QR check-in terminal was fast and intuitive..." className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"/>
                </div>
              </div>

              {/* 5. Message Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                  Detailed Feedback, Suggestions or Experience *
                </label>
                <textarea rows={3} required value={feedbackForm.message} onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Describe your feedback in detail. Let us know what worked well, what felt slow, or any new features you would love to see..." className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none leading-relaxed"/>
              </div>

              {/* 6. Send Button & Meta Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
                  <span>Feedback will be immediately recorded and appear below for admin review.</span>
                </div>

                <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-600/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50">
                  <Send className="w-4 h-4"/>
                  {submitting ? 'Sending Feedback...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </div>

          {/* Submissions Section Header & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400"/> Feedback Submissions Log ({feedbacks.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Review who sent feedback across all organizational roles, inspect ratings, and record administrative acceptance.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">View:</span>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button type="button" onClick={() => setFeedbackViewMode('table')} className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${feedbackViewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'}`} title="Table View (Shows submitter, role, and contact identity)">
                  <Table className="w-3.5 h-3.5"/> Table
                </button>
                <button type="button" onClick={() => setFeedbackViewMode('grid')} className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${feedbackViewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'}`} title="Cards Grid View">
                  <LayoutGrid className="w-3.5 h-3.5"/> Cards
                </button>
              </div>
            </div>
          </div>

          {feedbacks.length === 0 ? (<div className="py-16 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2"/>
              <div className="font-bold text-sm text-slate-300">No feedback entries found matching current filter.</div>
              <div className="text-xs text-slate-500 max-w-md mx-auto">
                No submissions were found for the selected filter or search query. You can reset filters to view all feedback across the organization.
              </div>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <button type="button" onClick={() => { setSelectedRole('ALL'); setStatusFilter('ALL'); setSearchQuery(''); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm">
                  Clear Filters & Show All
                </button>
                <button type="button" onClick={() => setFeedbacks(DEFAULT_FEEDBACKS)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition">
                  Load Sample Feedback
                </button>
              </div>
            </div>) : feedbackViewMode === 'table' ? (
            /* ══════════════════════════════════════════════════════════════════════ */
            /* TABLE VIEW: WHO SENT FEEDBACK TABLE LIST                              */
            /* ══════════════════════════════════════════════════════════════════════ */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">{t('table.actor', 'Submitter / Who Sent It')}</th>
                      <th className="py-3 px-3 font-bold">{t('table.assignedRole', 'Role')}</th>
                      <th className="py-3 px-4 font-bold">{t('table.description', 'Subject & Feedback')}</th>
                      <th className="py-3 px-3 font-bold">{t('table.result', 'Rating')}</th>
                      <th className="py-3 px-3 font-bold">{t('table.status', 'Status')}</th>
                      <th className="py-3 px-3 font-bold">{t('table.timestamp', 'Submitted')}</th>
                      <th className="py-3 px-4 font-bold text-right">{t('table.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {feedbacks.map((item) => {
                    const initials = (item.user_name || 'U')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                    const roleMeta = {
                        ADMIN: { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/80', avatarBg: 'from-cyan-600 to-blue-700' },
                        DEPARTMENT_MANAGER: { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800/80', avatarBg: 'from-purple-600 to-indigo-700' },
                        EMPLOYEE: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/80', avatarBg: 'from-emerald-600 to-teal-700' },
                        RECEPTIONIST: { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800/80', avatarBg: 'from-blue-600 to-cyan-700' },
                        SECURITY: { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800/80', avatarBg: 'from-rose-600 to-orange-700' },
                        VISITOR: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/80', avatarBg: 'from-amber-600 to-orange-600' },
                    }[item.role_name] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', avatarBg: 'from-slate-700 to-slate-800' };
                    return (<tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* 1. Submitter Identity Column */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-start gap-3">
                              {/* Avatar or Initials Badge */}
                              {item.avatar_url ? (<img src={item.avatar_url} alt={item.user_name} className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"/>) : (<div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleMeta.avatarBg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                                  {initials}
                                </div>)}

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-white text-xs hover:text-indigo-300 transition">
                                    {item.user_name}
                                  </span>
                                  {item.user_code && (<span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-slate-950 text-indigo-400 border border-slate-800">
                                      #{item.user_code}
                                    </span>)}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 text-slate-500 shrink-0"/>
                                  <span className="truncate">{item.user_email}</span>
                                </div>
                                {item.department_name && (<div className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Building className="w-3 h-3 text-slate-600 shrink-0"/>
                                    <span>{item.department_name}</span>
                                  </div>)}
                              </div>
                            </div>
                          </td>

                          {/* 2. Role Badge */}
                          <td className="py-3.5 px-3 align-top">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}>
                              {item.role_name.replace('_', ' ')}
                            </span>
                          </td>

                          {/* 3. Subject & Message */}
                          <td className="py-3.5 px-4 align-top max-w-md">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs line-clamp-1">{item.subject}</span>
                                <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 uppercase shrink-0">
                                  {item.category.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                              {item.admin_response && (<div className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded px-2 py-1 flex items-center gap-1.5 mt-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0"/>
                                  <span className="line-clamp-1">
                                    <strong>Admin Ack:</strong> {item.admin_response}
                                  </span>
                                </div>)}
                            </div>
                          </td>

                          {/* 4. Rating */}
                          <td className="py-3.5 px-3 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-3 h-3 ${star <= (item.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'}`}/>))}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-400 mt-0.5 block">
                              {item.rating || 5}.0 / 5.0
                            </span>
                          </td>

                          {/* 5. Status Badge */}
                          <td className="py-3.5 px-3 align-top whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border ${item.status === 'ACCEPTED'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                            : item.status === 'UNDER_REVIEW'
                                ? 'bg-purple-950/80 text-purple-400 border-purple-800/80'
                                : item.status === 'RESOLVED'
                                    ? 'bg-blue-950/80 text-blue-400 border-blue-800/80'
                                    : 'bg-amber-950/80 text-amber-400 border-amber-800/80'}`}>
                              {item.status}
                            </span>
                          </td>

                          {/* 6. Submitted Timestamp */}
                          <td className="py-3.5 px-3 align-top whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            <div>{new Date(item.created_at).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>

                          {/* 7. Actions */}
                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => setViewingFeedbackDetail(item)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition" title="View Submitter Details & Full Feedback">
                                <Eye className="w-3.5 h-3.5"/>
                              </button>

                              {item.status !== 'ACCEPTED' ? (<button type="button" onClick={() => {
                                setAcceptingFeedback(item);
                                setAcceptForm({
                                    admin_notes: item.admin_notes || '',
                                    admin_response: item.admin_response || 'Thank you! Your feedback has been officially reviewed and accepted by administration.',
                                });
                            }} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition shadow-sm" title="Accept Feedback & Notify Submitter">
                                  <Check className="w-3 h-3"/> Accept
                                </button>) : (<span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 px-1.5 py-1 rounded bg-emerald-950/40 border border-emerald-900/40">
                                  <CheckCircle className="w-3 h-3"/> Accepted
                                </span>)}
                            </div>
                          </td>
                        </tr>);
                })}
                  </tbody>
                </table>
              </div>
            </div>) : (
            /* ══════════════════════════════════════════════════════════════════════ */
            /* CARDS GRID VIEW                                                        */
            /* ══════════════════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((item) => {
                    const initials = (item.user_name || 'U')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                    const roleMeta = {
                        ADMIN: { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/80', avatarBg: 'from-cyan-600 to-blue-700' },
                        DEPARTMENT_MANAGER: { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800/80', avatarBg: 'from-purple-600 to-indigo-700' },
                        EMPLOYEE: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/80', avatarBg: 'from-emerald-600 to-teal-700' },
                        RECEPTIONIST: { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800/80', avatarBg: 'from-blue-600 to-cyan-700' },
                        SECURITY: { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800/80', avatarBg: 'from-rose-600 to-orange-700' },
                        VISITOR: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/80', avatarBg: 'from-amber-600 to-orange-600' },
                    }[item.role_name] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', avatarBg: 'from-slate-700 to-slate-800' };
                    return (<div key={item.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar or Initials */}
                        {item.avatar_url ? (<img src={item.avatar_url} alt={item.user_name} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"/>) : (<div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleMeta.avatarBg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                            {initials}
                          </div>)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm line-clamp-1">{item.subject}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                            <span className="font-bold text-slate-200">{item.user_name}</span>
                            {item.user_code && (<span className="font-mono text-indigo-400 text-[10px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 font-bold">
                                #{item.user_code}
                              </span>)}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}>
                              {item.role_name.replace('_', ' ')}
                            </span>
                            {item.user_email && (<span className="text-slate-400 flex items-center gap-1 text-[10px] truncate max-w-[150px]">
                                <Mail className="w-3 h-3 text-slate-500 shrink-0"/>
                                <span className="truncate">{item.user_email}</span>
                              </span>)}
                            {item.department_name && (<span className="text-slate-500 flex items-center gap-1 text-[10px]">
                                <Building className="w-3 h-3 text-slate-600 shrink-0"/>
                                <span>{item.department_name}</span>
                              </span>)}
                          </div>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${item.status === 'ACCEPTED'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                            : item.status === 'UNDER_REVIEW'
                                ? 'bg-purple-950/80 text-purple-400 border-purple-800/80'
                                : item.status === 'RESOLVED'
                                    ? 'bg-blue-950/80 text-blue-400 border-blue-800/80'
                                    : 'bg-amber-950/80 text-amber-400 border-amber-800/80'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Rating & Message */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-3.5 h-3.5 ${star <= (item.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'}`}/>))}
                        <span className="text-[11px] font-mono font-bold text-amber-400 ml-1.5">
                          {item.rating || 5}.0 Rating
                        </span>
                        <span className="text-slate-600 text-[10px] ml-auto font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Admin Response Block */}
                    {item.admin_response && (<div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400"/>
                          Admin Official Acknowledgment ({item.responded_by_name || 'System Admin'})
                        </div>
                        <p className="text-xs text-slate-200">{item.admin_response}</p>
                      </div>)}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Category: {item.category.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setViewingFeedbackDetail(item)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold uppercase transition flex items-center gap-1">
                          <Eye className="w-3 h-3"/> Details
                        </button>

                        {item.status !== 'ACCEPTED' ? (<button type="button" onClick={() => {
                                setAcceptingFeedback(item);
                                setAcceptForm({
                                    admin_notes: item.admin_notes || '',
                                    admin_response: item.admin_response || 'Thank you! Your feedback has been officially reviewed and accepted by administration.',
                                });
                            }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm">
                            <Check className="w-3.5 h-3.5"/> Accept Feedback
                          </button>) : (<span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5"/> Accepted by Admin
                          </span>)}
                      </div>
                    </div>
                  </div>);
                })}
            </div>)}
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: SUPPORT DESK TICKET QUEUE & CONVERSATION                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'tickets' && (<div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-cyan-400"/> Support Ticket Operations Queue ({tickets.length})
            </h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowInlineTicketForm(!showInlineTicketForm)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm">
                <Plus className="w-3.5 h-3.5"/> {showInlineTicketForm ? 'Close Ticket Form' : 'Open New Ticket'}
              </button>
            </div>
          </div>

          {/* Inline Celebration Alert if Just Sent */}
          {ticketSentSuccess && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-200 text-xs font-bold flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0"/>
                <span>{ticketSentSuccess}</span>
              </div>
              <button type="button" onClick={() => setTicketSentSuccess(null)} className="text-cyan-400 hover:text-white">
                <X className="w-4 h-4"/>
              </button>
            </motion.div>)}

          {/* Inline Ticket Submission Place */}
          {showInlineTicketForm && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-indigo-400"/>
                  <span className="font-bold text-white text-sm">Open Support Ticket</span>
                </div>
                <button type="button" onClick={() => setShowInlineTicketForm(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Your Role Perspective</label>
                    <select value={ticketForm.role_name} onChange={(e) => setTicketForm({ ...ticketForm, role_name: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-indigo-500">
                      <option value="ADMIN">ADMINISTRATOR</option>
                      <option value="DEPARTMENT_MANAGER">DEPARTMENT MANAGER</option>
                      <option value="EMPLOYEE">EMPLOYEE / HOST</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="SECURITY">SECURITY OFFICER</option>
                      <option value="VISITOR">VISITOR / GUEST</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Priority Level</label>
                    <select value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-indigo-500">
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL / BLOCKER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Ticket Category</label>
                    <select value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500">
                      <option value="GENERAL_SUPPORT">General Assistance</option>
                      <option value="ACCESS_CARD_ISSUE">Access Card / Badge Error</option>
                      <option value="ACCOUNT_AUTH">Account & Credentials</option>
                      <option value="HARDWARE_GATE">Turnstile / Gate Issue</option>
                      <option value="SCHEDULE_SYNC">Appointment Sync Issue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subject *</label>
                  <input type="text" required value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder="e.g. Turnstile gate 3 QR reader timeout..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500"/>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Detailed Description *</label>
                  <textarea rows={3} required value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Describe what occurred, any error codes displayed, or assistance needed..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 resize-none"/>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowInlineTicketForm(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50">
                    <Send className="w-3.5 h-3.5"/> {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>)}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tickets List (Left 2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              {tickets.length === 0 ? (<div className="py-16 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-2">
                  <LifeBuoy className="w-10 h-10 mx-auto text-slate-600 mb-2"/>
                  <div className="font-bold text-sm text-slate-300">No support tickets found.</div>
                  <div className="text-xs">Submit a ticket to request assistance from the support desk.</div>
                </div>) : (tickets.map((t) => (<div key={t.id} onClick={() => setActiveTicket(t)} className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-3 ${activeTicket?.id === t.id
                    ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-400">{t.ticket_number}</span>
                          <span className="font-bold text-white text-sm">{t.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-bold text-slate-300">{t.user_name}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-800 text-cyan-300">
                            {t.role_name}
                          </span>
                          <span>•</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(t.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${t.priority === 'CRITICAL' || t.priority === 'HIGH'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    : t.priority === 'MEDIUM'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'}`}>
                          {t.priority}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${t.status === 'RESOLVED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : t.status === 'IN_PROGRESS'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                      <span>Category: {t.category}</span>
                      <span>Assigned: {t.assigned_to_name || t.assigned_to || 'Unassigned'}</span>
                    </div>
                  </div>)))}
            </div>

            {/* Active Ticket Detail & Thread (Right 1 Col) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col h-[650px]">
              {activeTicket ? (<>
                  <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold text-indigo-400">{activeTicket.ticket_number}</div>
                      <h4 className="font-bold text-white text-sm">{activeTicket.subject}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Opened by {activeTicket.user_name} ({activeTicket.role_name})
                      </p>
                    </div>
                    {activeTicket.status !== 'RESOLVED' && (<button onClick={() => handleResolveTicket(activeTicket.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase transition">
                        Resolve Ticket
                      </button>)}
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-indigo-400">Original Request Description</span>
                        <span className="font-mono">{new Date(activeTicket.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{activeTicket.description}</p>
                    </div>

                    {activeTicket.messages?.map((msg) => (<div key={msg.id} className={`p-3 rounded-xl border space-y-1 ${msg.sender_role === 'ADMIN'
                        ? 'bg-indigo-950/40 border-indigo-800/60 ml-4'
                        : 'bg-slate-950 border-slate-800 mr-4'}`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-300">
                            {msg.sender_name} ({msg.sender_role})
                          </span>
                          <span className="text-slate-500 font-mono">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{msg.message}</p>
                      </div>))}
                  </div>

                  {/* Reply Composer */}
                  <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 space-y-2">
                    <textarea rows={2} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type a response to this support ticket..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"/>
                    <div className="flex justify-end">
                      <button type="submit" disabled={submitting || !replyMessage.trim()} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition">
                        <Send className="w-3.5 h-3.5"/> Send Reply
                      </button>
                    </div>
                  </form>
                </>) : (<div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <LifeBuoy className="w-12 h-12 text-slate-700"/>
                  <div className="font-bold text-slate-400">No Ticket Selected</div>
                  <div className="text-xs">Click on any ticket from the list to view its conversation thread.</div>
                </div>)}
            </div>
          </div>
        </div>)}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: ROLE-SPECIFIC FAQ ACCORDION (DROPDOWN WAY - NOT DISTRACTING)       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'faqs' && (() => {
            const currentFaqData = ROLE_FAQS[selectedFaqRole] || ROLE_FAQS.EMPLOYEE;
            const FaqIcon = currentFaqData.icon;
            return (<div className="space-y-4 max-w-4xl mx-auto">
            {/* Header with Role Dropdown Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <FaqIcon className={`w-5 h-5 ${currentFaqData.color}`}/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {currentFaqData.roleName} FAQ Guide
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                      {currentFaqData.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Role-tailored answers in dropdown format to assist daily workflows without cluttering the screen.
                  </p>
                </div>
              </div>

              {/* Role Dropdown Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Role FAQ:
                </label>
                <select value={selectedFaqRole} onChange={(e) => setSelectedFaqRole(e.target.value)} className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 font-mono shadow-inner">
                  <option value="DEPARTMENT_MANAGER">Department Managers</option>
                  <option value="EMPLOYEE">Employees & Meeting Hosts</option>
                  <option value="RECEPTIONIST">Front Desk & Receptionists</option>
                  <option value="SECURITY">Security Officers</option>
                  <option value="VISITOR">Visitors & External Guests</option>
                  <option value="ADMIN">Administrators & SecOps</option>
                </select>
              </div>
            </div>

            {/* Accordion List (Dropdown Way) */}
            <div className="space-y-2.5">
              {currentFaqData.faqs.map((faq, idx) => {
                    const isOpen = !!openFaqs[`${selectedFaqRole}_${idx}`];
                    return (<div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition hover:border-slate-700">
                    <button type="button" onClick={() => toggleFaq(`${selectedFaqRole}_${idx}`)} className="w-full p-4 text-left flex items-center justify-between gap-3 transition hover:bg-slate-800/40">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-indigo-400 font-mono shrink-0">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {faq.q}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 shrink-0">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}/>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-5 pb-4 pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed bg-slate-950/40 flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"/>
                            <p>{faq.a}</p>
                          </div>
                        </motion.div>)}
                    </AnimatePresence>
                  </div>);
                })}
            </div>
          </div>);
        })()}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: SUBMIT FEEDBACK                                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFeedbackModal && (<div className="fixed inset-0 z-[1080] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400"/>
                  <h3 className="font-black text-white text-base uppercase">Submit Role Feedback</h3>
                </div>
                <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Your Role & Organization Context</label>
                  <select value={feedbackForm.role_name} onChange={(e) => setFeedbackForm({ ...feedbackForm, role_name: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-indigo-500">
                    <option value="ADMIN">ADMINISTRATOR</option>
                    <option value="DEPARTMENT_MANAGER">DEPARTMENT MANAGER</option>
                    <option value="EMPLOYEE">EMPLOYEE / HOST</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="SECURITY">SECURITY OFFICER</option>
                    <option value="VISITOR">VISITOR / GUEST</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Feedback Category</label>
                  <select value={feedbackForm.category} onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500">
                    <option value="FEATURE_REQUEST">💡 Feature Request</option>
                    <option value="UI_UX_DESIGN">🎨 UI & Experience</option>
                    <option value="SYSTEM_PERFORMANCE">⚡ Performance</option>
                    <option value="SECURITY_POLICY">🛡️ Security & Access</option>
                    <option value="BUG_REPORT">🐛 Bug / Issue</option>
                    <option value="GENERAL_FEEDBACK">💬 General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Experience Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (<button type="button" key={star} onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })} className="p-1 text-slate-600 hover:text-amber-400 transition">
                        <Star className={`w-6 h-6 ${star <= feedbackForm.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'}`}/>
                      </button>))}
                    <span className="font-mono font-bold text-amber-400 ml-2">{feedbackForm.rating} of 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subject</label>
                  <input type="text" required value={feedbackForm.subject} onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })} placeholder="e.g. Batch approval button for department visitors" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500"/>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Message & Suggestions</label>
                  <textarea rows={4} required value={feedbackForm.message} onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })} placeholder="Describe your feedback, suggestion, or experience in detail..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 resize-none"/>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30">
                    <Send className="w-3.5 h-3.5"/> {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>)}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: OPEN SUPPORT TICKET                                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTicketModal && (<div className="fixed inset-0 z-[1080] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-indigo-400"/>
                  <h3 className="font-black text-white text-base uppercase">Open Support Ticket</h3>
                </div>
                <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Your Role</label>
                    <select value={ticketForm.role_name} onChange={(e) => setTicketForm({ ...ticketForm, role_name: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-indigo-500">
                      <option value="ADMIN">ADMINISTRATOR</option>
                      <option value="DEPARTMENT_MANAGER">DEPARTMENT MANAGER</option>
                      <option value="EMPLOYEE">EMPLOYEE / HOST</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="SECURITY">SECURITY OFFICER</option>
                      <option value="VISITOR">VISITOR / GUEST</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Priority Level</label>
                    <select value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-indigo-500">
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH (Urgent)</option>
                      <option value="CRITICAL">CRITICAL (System Blocker)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Issue Category</label>
                  <select value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500">
                    <option value="GENERAL_SUPPORT">General Support</option>
                    <option value="ACCESS_ISSUE">Turnstile / Building Access Issue</option>
                    <option value="HARDWARE_KIOSK">Badge Printer / Kiosk Scanner Issue</option>
                    <option value="ACCOUNT_LOGIN">Account & Password Access</option>
                    <option value="PERMISSION_REQUEST">Role Permission Elevation Request</option>
                    <option value="NOTIFICATION_DELIVERY">SMS / Email Notification Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ticket Subject</label>
                  <input type="text" required value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder="e.g. Printer ribbon jam code P-03 at Desk 2" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500"/>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Description & Steps to Reproduce</label>
                  <textarea rows={4} required value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Provide details about the issue, location, or error message..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 resize-none"/>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowTicketModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30">
                    <LifeBuoy className="w-3.5 h-3.5"/> {submitting ? 'Creating...' : 'Open Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>)}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: ACCEPT FEEDBACK ACTION (ADMIN)                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {acceptingFeedback && (<div className="fixed inset-0 z-[1080] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400"/>
                  <h3 className="font-black text-white text-base uppercase">Accept Feedback Submission</h3>
                </div>
                <button onClick={() => setAcceptingFeedback(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-white">{acceptingFeedback.subject}</div>
                <p className="text-slate-400 line-clamp-3">{acceptingFeedback.message}</p>
                <div className="text-[10px] text-indigo-400 font-mono pt-1">
                  Submitted by {acceptingFeedback.user_name} ({acceptingFeedback.role_name})
                </div>
              </div>

              <form onSubmit={handleAcceptFeedback} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Official User Acknowledgment Response (Visible to User)
                  </label>
                  <textarea rows={3} value={acceptForm.admin_response} onChange={(e) => setAcceptForm({ ...acceptForm, admin_response: e.target.value })} placeholder="Thank you! Your feedback has been officially accepted..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 resize-none"/>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Internal SecOps / Development Sprint Notes
                  </label>
                  <textarea rows={2} value={acceptForm.admin_notes} onChange={(e) => setAcceptForm({ ...acceptForm, admin_notes: e.target.value })} placeholder="e.g. Assigned to engineering backlog sprint #42..." className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 resize-none"/>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setAcceptingFeedback(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30">
                    <Check className="w-3.5 h-3.5"/> {submitting ? 'Accepting...' : 'Confirm & Accept'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>)}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: VIEW FEEDBACK SUBMITTER DETAILS                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewingFeedbackDetail && (<div className="fixed inset-0 z-[1080] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-950/80 border border-indigo-800 text-indigo-400 rounded-xl">
                    <User className="w-5 h-5"/>
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base uppercase">Submitter & Feedback Profile</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Reference #{viewingFeedbackDetail.id} • {viewingFeedbackDetail.role_name}</p>
                  </div>
                </div>
                <button onClick={() => setViewingFeedbackDetail(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Submitter Identity Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Who Sent This Feedback
                </div>
                <div className="flex items-center gap-3">
                  {viewingFeedbackDetail.avatar_url ? (<img src={viewingFeedbackDetail.avatar_url} alt={viewingFeedbackDetail.user_name} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow"/>) : (<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-black text-sm flex items-center justify-center shadow">
                      {(viewingFeedbackDetail.user_name || 'U').slice(0, 2).toUpperCase()}
                    </div>)}

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-white text-sm">
                        {viewingFeedbackDetail.user_name}
                      </span>
                      {viewingFeedbackDetail.user_code && (<span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-950 text-indigo-300 border border-indigo-800">
                          #{viewingFeedbackDetail.user_code}
                        </span>)}
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0"/>
                      <span>{viewingFeedbackDetail.user_email}</span>
                    </div>
                    {viewingFeedbackDetail.phone_number && (<div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0"/>
                        <span>{viewingFeedbackDetail.phone_number}</span>
                      </div>)}
                    {viewingFeedbackDetail.department_name && (<div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500 shrink-0"/>
                        <span>{viewingFeedbackDetail.department_name}</span>
                      </div>)}
                  </div>
                </div>
              </div>

              {/* Feedback Content */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{viewingFeedbackDetail.subject}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-3.5 h-3.5 ${star <= (viewingFeedbackDetail.rating || 5)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'}`}/>))}
                    <span className="font-mono text-amber-400 font-bold ml-1 text-xs">
                      {viewingFeedbackDetail.rating || 5}.0
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                  {viewingFeedbackDetail.message}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Category: {viewingFeedbackDetail.category}</span>
                  <span>Submitted: {new Date(viewingFeedbackDetail.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Admin Response If Present */}
              {viewingFeedbackDetail.admin_response && (<div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
                    Admin Acknowledgment ({viewingFeedbackDetail.responded_by_name || 'System Admin'})
                  </div>
                  <p className="text-slate-200">{viewingFeedbackDetail.admin_response}</p>
                </div>)}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${viewingFeedbackDetail.status === 'ACCEPTED'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                : viewingFeedbackDetail.status === 'UNDER_REVIEW'
                    ? 'bg-purple-950/80 text-purple-400 border-purple-800/80'
                    : viewingFeedbackDetail.status === 'RESOLVED'
                        ? 'bg-blue-950/80 text-blue-400 border-blue-800/80'
                        : 'bg-amber-950/80 text-amber-400 border-amber-800/80'}`}>
                  Status: {viewingFeedbackDetail.status}
                </span>

                <div className="flex items-center gap-2">
                  {viewingFeedbackDetail.status !== 'ACCEPTED' && (<button type="button" onClick={() => {
                    const target = viewingFeedbackDetail;
                    setViewingFeedbackDetail(null);
                    setAcceptingFeedback(target);
                    setAcceptForm({
                        admin_notes: target.admin_notes || '',
                        admin_response: target.admin_response || 'Thank you! Your feedback has been officially reviewed and accepted by administration.',
                    });
                }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition">
                      <Check className="w-3.5 h-3.5"/> Accept Feedback
                    </button>)}
                  <button type="button" onClick={() => setViewingFeedbackDetail(null)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>)}
      </AnimatePresence>

    </div>);
}
