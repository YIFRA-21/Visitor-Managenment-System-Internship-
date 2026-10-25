import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  Building,
  User,
  Filter,
  Grid,
  List,
  CalendarDays,
  FileText,
  Printer,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Shield,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  MonitorPlay,
  Briefcase
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { HostReassignmentModal } from './components/HostReassignmentModal';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import MetricCard, { dashboardContainerVariants } from './components/ExecutiveMetricCard';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

// Robust default mock data when database has empty records or offline
const DEFAULT_FALLBACK_MEETINGS = [
  {
    id: 101,
    appointment_number: 'APPT-2026-0891',
    reference_code: 'VMS-ENG-891',
    visitor_name: 'Elena Rostova',
    visitor_company: 'Quantum Dynamics',
    visitor_email: 'elena.r@quantumdyn.com',
    visitor_phone: '+1 (555) 382-9102',
    host_name: 'Sarah Connor',
    host_position: 'Senior Systems Architect',
    host_employee_id: 12,
    purpose: 'Quarterly Technical Architecture Review & Cloud Migration',
    meeting_type: 'Technical Review',
    priority: 'HIGH',
    room_id: 1,
    room_name: 'Conference Room Alpha (Floor 3)',
    room_capacity: 14,
    scheduled_start: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // starts in 30 mins
    scheduled_end: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    status: 'CONFIRMED',
    appointment_status: 'CONFIRMED',
    approval_status: 'APPROVED',
    is_vip: true,
    expected_attendees: 4
  },
  {
    id: 102,
    appointment_number: 'APPT-2026-0894',
    reference_code: 'VMS-OPS-894',
    visitor_name: 'Marcus Vance',
    visitor_company: 'Vance Logistics Ltd.',
    visitor_email: 'marcus@vancelogistics.co',
    visitor_phone: '+1 (555) 749-1188',
    host_name: 'James Reynolds',
    host_position: 'Operations Lead',
    host_employee_id: 15,
    purpose: 'Supplier Contract Renegotiation & SLA Alignment',
    meeting_type: 'Client & Vendor',
    priority: 'MEDIUM',
    room_id: 2,
    room_name: 'Boardroom Gemini (Floor 4)',
    room_capacity: 22,
    scheduled_start: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // currently active
    scheduled_end: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
    status: 'IN_PROGRESS',
    appointment_status: 'IN_PROGRESS',
    approval_status: 'APPROVED',
    is_vip: false,
    expected_attendees: 6
  },
  {
    id: 103,
    appointment_number: 'APPT-2026-0902',
    reference_code: 'VMS-SEC-902',
    visitor_name: 'David K. Mercer',
    visitor_company: 'Aegis Cyber Defense',
    visitor_email: 'd.mercer@aegiscyber.io',
    visitor_phone: '+1 (555) 891-2309',
    host_name: 'Dr. Evelyn Reed',
    host_position: 'Chief Information Security Officer',
    host_employee_id: 9,
    purpose: 'Annual ISO 27001 Security Audit and Physical Access Inspection',
    meeting_type: 'Audit & Compliance',
    priority: 'URGENT',
    room_id: 3,
    room_name: 'Executive Briefing Center (Floor 5)',
    room_capacity: 10,
    scheduled_start: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // in 4 hours
    scheduled_end: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    status: 'CONFIRMED',
    appointment_status: 'CONFIRMED',
    approval_status: 'APPROVED',
    is_vip: true,
    expected_attendees: 3
  },
  {
    id: 104,
    appointment_number: 'APPT-2026-0908',
    reference_code: 'VMS-DEV-908',
    visitor_name: 'Samantha Wright',
    visitor_company: 'Apex Design Collective',
    visitor_email: 'sam@apexdesign.studio',
    visitor_phone: '+1 (555) 412-8871',
    host_name: 'Michael Torres',
    host_position: 'Product Design Lead',
    host_employee_id: 18,
    purpose: 'Design System Sprint Kickoff & UX Prototype Walkthrough',
    meeting_type: 'Sprint Planning',
    priority: 'STANDARD',
    room_id: 4,
    room_name: 'Innovation Hub (Floor 2)',
    room_capacity: 8,
    scheduled_start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
    scheduled_end: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    status: 'PENDING_HOST_APPROVAL',
    appointment_status: 'PENDING_HOST_APPROVAL',
    approval_status: 'PENDING',
    is_vip: false,
    expected_attendees: 5
  },
  {
    id: 105,
    appointment_number: 'APPT-2026-0870',
    reference_code: 'VMS-FIN-870',
    visitor_name: 'Jordan Miller',
    visitor_company: 'Pinnacle Analytics',
    visitor_email: 'jordan@pinnacle.org',
    visitor_phone: '+1 (555) 601-3444',
    host_name: 'Sarah Connor',
    host_position: 'Senior Systems Architect',
    host_employee_id: 12,
    purpose: 'Financial Data Pipeline Integration Review',
    meeting_type: 'Technical Sync',
    priority: 'MEDIUM',
    room_id: 1,
    room_name: 'Conference Room Alpha (Floor 3)',
    room_capacity: 14,
    scheduled_start: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // yesterday
    scheduled_end: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: 'COMPLETED',
    appointment_status: 'COMPLETED',
    approval_status: 'APPROVED',
    is_vip: false,
    expected_attendees: 2
  }
];

const DEFAULT_ROOMS = [
  { id: 1, name: 'Conference Room Alpha', floor: 'Floor 3', capacity: 14, amenities: ['4K Video Bar', 'Dual Screen', 'Whiteboard', 'AirPlay'], status: 'Available' },
  { id: 2, name: 'Boardroom Gemini', floor: 'Floor 4', capacity: 22, amenities: ['Executive Polycom', 'Telepresence', 'Conference Microphones', 'Catering Station'], status: 'In Use' },
  { id: 3, name: 'Executive Briefing Center', floor: 'Floor 5', capacity: 10, amenities: ['Smart Glass', 'Secured Soundproofing', 'Private Restroom'], status: 'Reserved' },
  { id: 4, name: 'Innovation Hub', floor: 'Floor 2', capacity: 8, amenities: ['Miro Digital Board', 'Mobile Pods', 'Lounge Seating'], status: 'Available' },
  { id: 5, name: 'Huddle Room Orion', floor: 'Floor 3', capacity: 4, amenities: ['Webcam', 'Direct HDMI', 'Acoustic Panel'], status: 'Available' }
];

export default function DepartmentAppointmentsView() {
  const { t } = useLanguage();
  const { isDark = true } = useTheme() || {};
  const { toResponse, toSuccess, toError, toConfirmation } = useResponseNavigation();
  // Primary States
  const [appointments, setAppointments] = useState([]);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filtering & View Modes
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' | 'timeline' | 'rooms'
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [hostFilter, setHostFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  // Modals & Active Drawers
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState(null);
  const [selectedApptIdForDetails, setSelectedApptIdForDetails] = useState(null);

  // New Meeting Form State
  const [newMeeting, setNewMeeting] = useState({
    purpose: '',
    meeting_type: 'Technical Sync',
    priority: 'MEDIUM',
    host_employee_id: '',
    visitor_name: '',
    visitor_company: '',
    visitor_email: '',
    visitor_phone: '',
    expected_attendees: 2,
    room_id: 1,
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    notes: '',
    issue_qr_pass: true,
    send_email_notification: true
  });

  // Reschedule Form State
  const [rescheduleData, setRescheduleData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '11:00',
    end_time: '12:00',
    reason: ''
  });

  // Cancel Reason State
  const [cancelReason, setCancelReason] = useState('');

  // 1. Fetch initial appointments, rooms, and department hosts
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch appointments
      let apptList = [];
      try {
        const data = await managerApi.getAppointments({
          timeFilter: timeFilter !== 'ALL' ? timeFilter : undefined,
          search
        });
        if (Array.isArray(data) && data.length > 0) {
          apptList = data;
        } else {
          apptList = DEFAULT_FALLBACK_MEETINGS;
        }
      } catch (e) {
        apptList = DEFAULT_FALLBACK_MEETINGS;
      }
      setAppointments(apptList);

      // 2. Fetch rooms
      try {
        const roomData = await managerApi.getRooms();
        if (roomData?.rooms && roomData.rooms.length > 0) {
          setRooms(roomData.rooms);
        }
      } catch (e) {
        // use default rooms
      }

      // 3. Fetch department employees/hosts
      try {
        const empData = await managerApi.getEmployees();
        if (Array.isArray(empData) && empData.length > 0) {
          setEmployees(empData);
        } else {
          setEmployees([
            { id: 12, full_name: 'Sarah Connor', position: 'Senior Systems Architect', availability_status: 'AVAILABLE' },
            { id: 15, full_name: 'James Reynolds', position: 'Operations Lead', availability_status: 'BUSY' },
            { id: 9, full_name: 'Dr. Evelyn Reed', position: 'CISO', availability_status: 'AVAILABLE' },
            { id: 18, full_name: 'Michael Torres', position: 'Product Design Lead', availability_status: 'AVAILABLE' }
          ]);
        }
      } catch (e) {
        // fallback employees
      }
    } catch (err) {
      setError(err?.message || 'Failed to load meeting management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Quick Search handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Filtered dataset
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Search text filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesVisitor = appt.visitor_name?.toLowerCase().includes(q);
        const matchesHost = appt.host_name?.toLowerCase().includes(q);
        const matchesPurpose = appt.purpose?.toLowerCase().includes(q);
        const matchesCode = (appt.reference_code || appt.appointment_number || '').toLowerCase().includes(q);
        const matchesCompany = appt.visitor_company?.toLowerCase().includes(q);
        if (!matchesVisitor && !matchesHost && !matchesPurpose && !matchesCode && !matchesCompany) {
          return false;
        }
      }

      // Host employee filter
      if (hostFilter !== 'ALL') {
        const hostIdMatch = String(appt.host_employee_id) === String(hostFilter);
        const hostNameMatch = appt.host_name === hostFilter;
        if (!hostIdMatch && !hostNameMatch) return false;
      }

      // Room filter
      if (roomFilter !== 'ALL') {
        const roomIdMatch = String(appt.room_id) === String(roomFilter);
        const roomNameMatch = appt.room_name?.includes(roomFilter);
        if (!roomIdMatch && !roomNameMatch) return false;
      }

      // Status / Time filters
      const status = (appt.appointment_status || appt.status || '').toUpperCase();
      const now = new Date();
      const start = new Date(appt.scheduled_start);
      const isToday = start.toDateString() === now.toDateString();

      if (timeFilter === 'TODAY' && !isToday) return false;
      if (timeFilter === 'UPCOMING' && (start <= now || status === 'COMPLETED' || status === 'CANCELLED')) return false;
      if (timeFilter === 'IN_PROGRESS' && status !== 'IN_PROGRESS') return false;
      if (timeFilter === 'COMPLETED' && status !== 'COMPLETED' && status !== 'CHECKED_OUT') return false;
      if (timeFilter === 'CANCELLED' && status !== 'CANCELLED' && !appt.is_cancelled) return false;

      return true;
    });
  }, [appointments, search, hostFilter, roomFilter, timeFilter]);

  // Dynamic KPI Stats
  const kpiStats = useMemo(() => {
    const total = appointments.length;
    const now = new Date();
    const todayCount = appointments.filter((a) => new Date(a.scheduled_start).toDateString() === now.toDateString()).length;
    const inProgressCount = appointments.filter((a) => (a.appointment_status || a.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const pendingApprovalCount = appointments.filter((a) => (a.approval_status || a.status || '').toUpperCase().includes('PENDING')).length;
    const roomUtilization = Math.min(100, Math.round(((inProgressCount + todayCount) / Math.max(rooms.length, 1)) * 35));

    return {
      total,
      todayCount,
      inProgressCount,
      pendingApprovalCount,
      roomUtilization
    };
  }, [appointments, rooms]);

  // Format Helpers
  const formatDateTime = (isoString) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: isoString, time: '' };
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || 'SCHEDULED').toUpperCase();
    if (s === 'IN_PROGRESS' || s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>In Progress</span>
        </span>
      );
    }
    if (s === 'CONFIRMED' || s === 'APPROVED' || s === 'SCHEDULED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Confirmed</span>
        </span>
      );
    }
    if (s.includes('PENDING')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
          <Clock3 className="w-3 h-3" />
          <span>Pending Approval</span>
        </span>
      );
    }
    if (s === 'COMPLETED' || s === 'CHECKED_OUT') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700/60 border border-slate-600 text-slate-300">
          <Check className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'REJECTED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <XCircle className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
        {s}
      </span>
    );
  };

  // Schedule New Meeting Submit
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeeting.visitor_name.trim()) {
      toResponse(RESPONSE_TYPES.VALIDATION_FAILED, {
        title: 'Visitor Name Required',
        message: 'Please enter the full name of the visitor attending the meeting.',
        returnUrl: window.location.pathname + window.location.search,
      });
      return;
    }
    if (!newMeeting.purpose.trim()) {
      toResponse(RESPONSE_TYPES.VALIDATION_FAILED, {
        title: 'Meeting Purpose Required',
        message: 'Please specify the business agenda and purpose for this department meeting.',
        returnUrl: window.location.pathname + window.location.search,
      });
      return;
    }

    const hostObj = employees.find((emp) => String(emp.id) === String(newMeeting.host_employee_id)) || employees[0];
    const roomObj = rooms.find((r) => String(r.id) === String(newMeeting.room_id)) || rooms[0];

    const startIso = `${newMeeting.scheduled_date}T${newMeeting.start_time}:00`;
    const endIso = `${newMeeting.scheduled_date}T${newMeeting.end_time}:00`;

    const createdRecord = {
      id: Date.now(),
      appointment_number: `APPT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      reference_code: `VMS-MGT-${Math.floor(100 + Math.random() * 900)}`,
      visitor_name: newMeeting.visitor_name,
      visitor_company: newMeeting.visitor_company || 'Independent Guest',
      visitor_email: newMeeting.visitor_email,
      visitor_phone: newMeeting.visitor_phone,
      host_name: hostObj ? hostObj.full_name : 'Department Manager',
      host_position: hostObj ? hostObj.position : 'Manager',
      host_employee_id: hostObj ? hostObj.id : null,
      purpose: newMeeting.purpose,
      meeting_type: newMeeting.meeting_type,
      priority: newMeeting.priority,
      room_id: roomObj ? roomObj.id : 1,
      room_name: roomObj ? roomObj.name : 'Executive Room',
      room_capacity: roomObj ? roomObj.capacity : 10,
      scheduled_start: startIso,
      scheduled_end: endIso,
      status: 'CONFIRMED',
      appointment_status: 'CONFIRMED',
      approval_status: 'APPROVED',
      is_vip: newMeeting.priority === 'HIGH' || newMeeting.priority === 'URGENT',
      expected_attendees: Number(newMeeting.expected_attendees) || 2
    };

    try {
      await managerApi.createAppointment({
        visitor_name: newMeeting.visitor_name,
        visitor_email: newMeeting.visitor_email,
        host_employee_id: newMeeting.host_employee_id,
        room_id: newMeeting.room_id,
        scheduled_start: startIso,
        scheduled_end: endIso,
        purpose: newMeeting.purpose
      });
      toSuccess({
        type: RESPONSE_TYPES.APPOINTMENT_SUBMISSION_RESULT,
        title: 'Meeting Scheduled Successfully',
        message: `Department meeting "${createdRecord.purpose}" has been confirmed for ${createdRecord.visitor_name}.`,
        referenceId: createdRecord.reference_code,
        entityType: 'Meeting Appointment',
        entityName: createdRecord.purpose,
        returnUrl: window.location.pathname + window.location.search,
      });
    } catch (err) {
      toError(err, {
        title: 'Meeting Scheduling Failed',
        returnUrl: window.location.pathname + window.location.search,
      });
      return;
    }

    setAppointments([createdRecord, ...appointments]);
    setShowScheduleModal(false);

    // Reset Form
    setNewMeeting({
      purpose: '',
      meeting_type: 'Technical Sync',
      priority: 'MEDIUM',
      host_employee_id: '',
      visitor_name: '',
      visitor_company: '',
      visitor_email: '',
      visitor_phone: '',
      expected_attendees: 2,
      room_id: 1,
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '11:00',
      notes: '',
      issue_qr_pass: true,
      send_email_notification: true
    });
  };

  // Reschedule Submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedForAction) return;

    const startIso = `${rescheduleData.date}T${rescheduleData.start_time}:00`;
    const endIso = `${rescheduleData.date}T${rescheduleData.end_time}:00`;

    try {
      await managerApi.rescheduleAppointment(selectedForAction.id, {
        new_start: startIso,
        new_end: endIso,
        reason: rescheduleData.reason
      });
      setShowRescheduleModal(false);
      toSuccess({
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Meeting Rescheduled Successfully',
        message: `Meeting #${selectedForAction.reference_code || selectedForAction.appointment_number} has been updated to ${startIso.replace('T', ' ')}.`,
        referenceId: selectedForAction.reference_code || selectedForAction.appointment_number,
        entityType: 'Department Meeting',
        entityName: selectedForAction.purpose,
        returnUrl: window.location.pathname + window.location.search,
      });
    } catch (err) {
      toError(err, {
        title: 'Reschedule Failed',
        entityType: 'Department Meeting',
        returnUrl: window.location.pathname + window.location.search,
      });
    }
  };

  // Cancel Meeting Submit
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedForAction) return;

    setShowCancelModal(false);
    toConfirmation({
      title: 'Confirm Department Meeting Cancellation',
      message: `Cancel meeting #${selectedForAction.reference_code || selectedForAction.appointment_number} with ${selectedForAction.visitor_name}?`,
      entityType: 'Department Meeting',
      entityName: selectedForAction.purpose,
      entityId: selectedForAction.id,
      consequences: [
        'The host employee and visitor will be notified of cancellation.',
        'Reserved room and AV equipment allocations will be released immediately.',
        'The audit log will record managerial cancellation with reason provided.'
      ],
      confirmLabel: 'Confirm Cancellation',
      confirmVariant: 'danger',
      apiEndpoint: `/manager/appointments/${selectedForAction.id}/cancel`,
      apiMethod: 'POST',
      apiPayload: { reason: cancelReason || 'Cancelled by department manager' },
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.CANCELLATION_SUCCESS,
        title: 'Meeting Cancelled',
        message: `Meeting #${selectedForAction.reference_code || selectedForAction.appointment_number} has been officially cancelled.`,
      }
    });
  };

  // Reassign Host Success
  const handleReassignSuccess = (result) => {
    if (selectedForAction && result?.newHost) {
      setShowReassignModal(false);
      toSuccess({
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Host Reassigned Successfully',
        message: `Meeting #${selectedForAction.reference_code || selectedForAction.appointment_number} reassigned to ${result.newHost.full_name}.`,
        referenceId: selectedForAction.reference_code || selectedForAction.appointment_number,
        entityType: 'Department Meeting',
        entityName: selectedForAction.purpose,
        returnUrl: window.location.pathname + window.location.search,
      });
    }
    setShowReassignModal(false);
  };

  // Print/Export Meeting Pass
  const handlePrintMeeting = (appt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Meeting Access Pass - ${appt.reference_code || appt.appointment_number}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
            .card { background: white; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 2px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .badge { background: #10b981; color: white; padding: 6px 14px; border-radius: 999px; font-weight: bold; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
            .val { font-size: 15px; font-weight: 600; color: #0f172a; }
            .qr-box { background: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; font-family: monospace; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <h2 style="margin:0 0 6px 0; color:#0f172a;">Official Visitor & Meeting Pass</h2>
                <div style="font-size:13px; color:#64748b;">Department Meeting & Access Authorization</div>
              </div>
              <div><span class="badge">AUTHORIZED PASS</span></div>
            </div>
            <div class="grid">
              <div>
                <div class="label">Visitor Name</div>
                <div class="val">${appt.visitor_name}</div>
                <div style="font-size:12px; color:#64748b;">${appt.visitor_company || 'Independent'}</div>
              </div>
              <div>
                <div class="label">Host Employee</div>
                <div class="val">${appt.host_name}</div>
                <div style="font-size:12px; color:#64748b;">${appt.host_position || 'Staff'}</div>
              </div>
              <div>
                <div class="label">Scheduled Time</div>
                <div class="val">${new Date(appt.scheduled_start).toLocaleString()}</div>
              </div>
              <div>
                <div class="label">Meeting Room / Space</div>
                <div class="val">${appt.room_name || 'Department Meeting Room'}</div>
              </div>
            </div>
            <div style="margin-bottom: 24px;">
              <div class="label">Purpose / Agenda</div>
              <div class="val" style="font-size:14px; color:#334155;">${appt.purpose}</div>
            </div>
            <div class="qr-box">
              PASS CODE: [ ${appt.reference_code || appt.appointment_number} ]
              <div style="font-size:11px; font-weight:normal; margin-top:8px; color:#64748b;">Present this pass at security access gates & department reception.</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Toast Notification with 10s Decreasing Loading & Pause on Hover */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full">
          <CountdownAlert
            alert={{ type: 'success', message: successToast }}
            onClose={() => setSuccessToast('')}
            duration={10}
          />
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-start sm:items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>{t('appointment.title', 'Meeting & Appointment Hub')}</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Department Manager
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Live Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t('managerDash.subtitle', 'End-to-end management of department conference rooms, host allocations, visitor schedules, and access passes.')}
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition active:scale-95"
            title="Refresh All Meeting Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{t('form.refresh', 'Refresh')}</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 border border-emerald-500/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards - Manager Dashboard Card Style with Real Data Animation */}
      <motion.div
        variants={dashboardContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        <MetricCard
          title="Total Meetings"
          value={kpiStats.total}
          subtitle="Department scope"
          badge="Total"
          theme="indigo"
          isActive={timeFilter === 'ALL'}
          onClick={() => setTimeFilter('ALL')}
          icon={<Calendar className="w-4 h-4 text-indigo-400" />}
        />

        <MetricCard
          title="Today's Schedule"
          value={kpiStats.todayCount}
          subtitle="Visits on calendar today"
          badge="Today"
          theme="emerald"
          isActive={timeFilter === 'TODAY'}
          onClick={() => setTimeFilter('TODAY')}
          icon={<Clock className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="In-Progress"
          value={kpiStats.inProgressCount}
          subtitle="Active in department"
          badge="Active"
          theme="amber"
          isActive={timeFilter === 'IN_PROGRESS'}
          onClick={() => setTimeFilter('IN_PROGRESS')}
          icon={<Users className="w-4 h-4 text-amber-400" />}
        />

        <MetricCard
          title="Pending Approvals"
          value={kpiStats.pendingApprovalCount}
          subtitle="Host action needed"
          badge="Action Req."
          theme="sky"
          isActive={timeFilter === 'UPCOMING'}
          onClick={() => setTimeFilter('UPCOMING')}
          icon={<Clock3 className="w-4 h-4 text-sky-400" />}
        />

        <MetricCard
          title="Room Utilization"
          value={kpiStats.roomUtilization}
          suffix="%"
          subtitle={`${rooms.length} spaces tracked`}
          badge="Live Capacity"
          theme="purple"
          isActive={viewMode === 'rooms'}
          onClick={() => setViewMode(viewMode === 'rooms' ? 'list' : 'rooms')}
          icon={<Building className="w-4 h-4 text-purple-400" />}
        />
      </motion.div>

      {/* Filter and View Controls Bar */}
      <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('placeholder.searchAppointments', 'Search by visitor, host, reference #, or agenda...')}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </form>

          {/* Quick Selectors & View Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Host Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={hostFilter}
                onChange={(e) => setHostFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">All Hosts</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-slate-200">
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Dense List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Card Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'timeline' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Daily Schedule / Timeline"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('rooms')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'rooms' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Live Room Occupancy"
              >
                <MonitorPlay className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
          {[
            { id: 'ALL', label: 'All Meetings' },
            { id: 'TODAY', label: "Today's Visits" },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                timeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN VIEW AREA */}
      {loading ? (
        <div className="py-24 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading department appointments & meeting spaces...</span>
        </div>
      ) : filteredAppointments.length === 0 && viewMode !== 'rooms' ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs space-y-3">
          <Calendar className="w-8 h-8 mx-auto text-slate-600" />
          <p className="font-semibold text-slate-400">No scheduled meetings match this filter.</p>
          <p className="text-slate-500">Try adjusting your filters, searching another keyword, or schedule a new meeting.</p>
          <button
            onClick={() => {
              setTimeFilter('ALL');
              setSearch('');
              setHostFilter('ALL');
              setRoomFilter('ALL');
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* 1. DENSE TABLE LIST VIEW */}
          {viewMode === 'list' && (
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">{t('table.visitor', 'Visitor / Guest')}</th>
                      <th className="py-3.5 px-4">{t('table.purpose', 'Meeting Agenda & Type')}</th>
                      <th className="py-3.5 px-4">{t('table.host', 'Assigned Host')}</th>
                      <th className="py-3.5 px-4">{t('table.room', 'Room & Space')}</th>
                      <th className="py-3.5 px-4">{t('table.time', 'Schedule Window')}</th>
                      <th className="py-3.5 px-4 text-center">{t('table.status', 'Status')}</th>
                      <th className="py-3.5 px-4 text-right">{t('table.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAppointments.map((appt) => {
                      const time = formatDateTime(appt.scheduled_start);
                      return (
                        <tr key={appt.id} className="hover:bg-slate-850/50 transition">
                          {/* Visitor Column */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                {appt.visitor_name ? appt.visitor_name.charAt(0) : 'V'}
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <p className="font-semibold text-white">{appt.visitor_name}</p>
                                  {appt.is_vip && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">{appt.visitor_company || 'Independent'}</p>
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                  #{appt.reference_code || appt.appointment_number}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Agenda & Purpose */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-medium text-slate-200 line-clamp-1">{appt.purpose || 'Department Meeting'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                                {appt.meeting_type || 'Sync'}
                              </span>
                              {appt.priority && (
                                <span
                                  className={`text-[9px] uppercase font-bold ${
                                    appt.priority === 'URGENT' || appt.priority === 'HIGH'
                                      ? 'text-rose-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {appt.priority}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Host Employee */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <p className="text-slate-200 font-medium">{appt.host_name || 'Unassigned'}</p>
                                <p className="text-[10px] text-slate-400">{appt.host_position || 'Department Staff'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Room Column */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-1.5 text-slate-200">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-medium">{appt.room_name || 'Conference Room Alpha'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 ml-5 block">
                              Max: {appt.room_capacity || 10} pax
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="text-slate-200 font-medium">{time.date}</p>
                            <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{time.time}</span>
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {getStatusBadge(appt.appointment_status || appt.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => setSelectedMeeting(appt)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                                title="Full Meeting View & Actions"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Reassign Host */}
                              <button
                                onClick={() => {
                                  setSelectedForAction(appt);
                                  setShowReassignModal(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition"
                                title="Reassign Host Employee"
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>

                              {/* Reschedule */}
                              <button
                                onClick={() => {
                                  setSelectedForAction(appt);
                                  setShowRescheduleModal(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium transition"
                                title="Reschedule Meeting"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Pass */}
                              <button
                                onClick={() => handlePrintMeeting(appt)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                                title="Print Meeting Pass"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancel */}
                              <button
                                onClick={() => {
                                  setSelectedForAction(appt);
                                  setShowCancelModal(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg text-xs font-medium transition"
                                title="Cancel Meeting"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. RESPONSIVE GRID / CARDS VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appt) => {
                const time = formatDateTime(appt.scheduled_start);
                return (
                  <div
                    key={appt.id}
                    className="bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top ribbon */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{appt.reference_code || appt.appointment_number}
                          </span>
                          <h4 className="font-bold text-white text-base mt-0.5 line-clamp-1">{appt.purpose}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium inline-block mt-1">
                            {appt.meeting_type || 'Sync'}
                          </span>
                        </div>
                        <div>{getStatusBadge(appt.appointment_status || appt.status)}</div>
                      </div>

                      {/* Visitor & Host Specs */}
                      <div className="space-y-3 py-3 text-xs">
                        {/* Visitor Info */}
                        <div className="flex items-center space-x-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                          <div className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                            {appt.visitor_name ? appt.visitor_name.charAt(0) : 'V'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white truncate">{appt.visitor_name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{appt.visitor_company || 'Independent Visitor'}</p>
                          </div>
                        </div>

                        {/* Host Employee */}
                        <div className="flex items-center justify-between text-slate-300 text-xs px-1">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Host:</span>
                          </span>
                          <span className="font-semibold text-white">{appt.host_name || 'Staff'}</span>
                        </div>

                        {/* Room Location */}
                        <div className="flex items-center justify-between text-slate-300 text-xs px-1">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Location:</span>
                          </span>
                          <span className="font-semibold text-slate-200">{appt.room_name || 'Conference Room Alpha'}</span>
                        </div>

                        {/* Scheduled Time */}
                        <div className="flex items-center justify-between text-slate-300 text-xs px-1">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            <span>Schedule:</span>
                          </span>
                          <span className="font-semibold text-slate-200">
                            {time.date} ({time.time})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedMeeting(appt)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>

                      <button
                        onClick={() => handlePrintMeeting(appt)}
                        className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs border border-slate-800"
                        title="Print Meeting Pass"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedForAction(appt);
                          setShowRescheduleModal(true);
                        }}
                        className="p-2 bg-slate-850 hover:bg-slate-800 text-amber-300 rounded-xl text-xs border border-slate-800"
                        title="Reschedule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. TIMELINE / DAILY SCHEDULE VIEW */}
          {viewMode === 'timeline' && (
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4 text-emerald-400" />
                    <span>Live Meeting Timeline</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological schedule of visits and room occupancies for the active department.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Upcoming</span>
                  </span>
                  <span className="flex items-center space-x-1 ml-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>In Progress</span>
                  </span>
                </div>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-8 space-y-6 py-2">
                {filteredAppointments
                  .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
                  .map((appt) => {
                    const time = formatDateTime(appt.scheduled_start);
                    const isNow = (appt.appointment_status || appt.status || '').toUpperCase() === 'IN_PROGRESS';
                    return (
                      <div key={appt.id} className="relative pl-6 sm:pl-8 group">
                        {/* Timeline Node */}
                        <div
                          className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition ${
                            isNow
                              ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-500/50 scale-125'
                              : 'bg-emerald-500 border-slate-950 group-hover:scale-110'
                          }`}
                        />

                        {/* Content Card */}
                        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                                {time.time}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">{time.date}</span>
                              {getStatusBadge(appt.appointment_status || appt.status)}
                            </div>
                            <h4 className="font-bold text-white text-sm">{appt.purpose}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                              <span className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Visitor: {appt.visitor_name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Building className="w-3.5 h-3.5 text-sky-400" />
                                <span>Host: {appt.host_name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                <span>{appt.room_name || 'Room Alpha'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => setSelectedMeeting(appt)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handlePrintMeeting(appt)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                              title="Print Pass"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 4. LIVE MEETING ROOMS & SPACES VIEW */}
          {viewMode === 'rooms' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>Conference Rooms & Meeting Spaces</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live department occupancy status, AV equipment profiles, and instant room allocations.
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Conference Room</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => {
                  const currentBooking = appointments.find(
                    (a) =>
                      String(a.room_id) === String(room.id) &&
                      (a.appointment_status || a.status || '').toUpperCase() === 'IN_PROGRESS'
                  );
                  const nextBooking = appointments.find(
                    (a) =>
                      String(a.room_id) === String(room.id) &&
                      (a.appointment_status || a.status || '').toUpperCase() === 'CONFIRMED'
                  );

                  return (
                    <div
                      key={room.id}
                      className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono">{room.floor || 'Floor 3'}</span>
                            <h4 className="font-bold text-white text-base mt-0.5">{room.name}</h4>
                            <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>Capacity: {room.capacity || 10} persons</span>
                            </p>
                          </div>
                          <div>
                            {currentBooking ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                In Use
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amenities */}
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                            Equipped Amenities
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(room.amenities || ['Screen Display', 'Webcam', 'Sound System']).map((amenity, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Current & Next Booking */}
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                          {currentBooking ? (
                            <div>
                              <p className="text-[10px] text-amber-400 font-bold uppercase">Active Session</p>
                              <p className="text-white font-medium truncate">{currentBooking.purpose}</p>
                              <p className="text-[11px] text-slate-400">Host: {currentBooking.host_name}</p>
                            </div>
                          ) : nextBooking ? (
                            <div>
                              <p className="text-[10px] text-sky-400 font-bold uppercase">Upcoming Next</p>
                              <p className="text-white font-medium truncate">{nextBooking.purpose}</p>
                              <p className="text-[11px] text-slate-400">
                                {formatDateTime(nextBooking.scheduled_start).time} with {nextBooking.visitor_name}
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-500 italic text-[11px]">No active meetings queued right now.</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setNewMeeting((prev) => ({ ...prev, room_id: room.id }));
                          setShowScheduleModal(true);
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Schedule into this Room</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: SCHEDULE / CREATE MEETING MODAL                  */}
      {/* ========================================================= */}
      {showScheduleModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isDark ? 'bg-black/90' : 'bg-slate-950/70'
        }`}>
          <div 
            className={`border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 ${
              isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
            }`}
            style={{
              backgroundColor: isDark ? '#0c1322' : '#ffffff',
              opacity: 1
            }}
          >
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Schedule Department Meeting</h3>
                  <p className="text-xs text-slate-400">Configure meeting agenda, assigned host, guest details, and space reservation.</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              {/* Meeting Agenda & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.meetingSubject', 'Meeting Subject / Agenda')} *</label>
                  <input
                    type="text"
                    required
                    value={newMeeting.purpose}
                    onChange={(e) => setNewMeeting({ ...newMeeting, purpose: e.target.value })}
                    placeholder={t('placeholder.meetingSubject', 'e.g. Vendor Q2 Agreement Review & Security Audit')}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.priority', 'Meeting Priority')}</label>
                  <select
                    value={newMeeting.priority}
                    onChange={(e) => setNewMeeting({ ...newMeeting, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="STANDARD">{t('priority.standard', 'Standard')}</option>
                    <option value="MEDIUM">{t('priority.medium', 'Medium')}</option>
                    <option value="HIGH">{t('priority.high', 'High Priority')}</option>
                    <option value="URGENT">{t('priority.urgent', 'Urgent / Executive')}</option>
                  </select>
                </div>
              </div>

              {/* Host & Meeting Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.assignedHost', 'Assigned Department Host')} *</label>
                  <select
                    value={newMeeting.host_employee_id}
                    onChange={(e) => setNewMeeting({ ...newMeeting, host_employee_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">{t('form.selectHost', 'Select Host Employee...')}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.position || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.selectRoom', 'Select Meeting Space / Room')} *</label>
                  <select
                    value={newMeeting.room_id}
                    onChange={(e) => setNewMeeting({ ...newMeeting, room_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.floor} • Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Window */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.meetingDate', 'Meeting Date')} *</label>
                  <input
                    type="date"
                    required
                    value={newMeeting.scheduled_date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.startTime', 'Start Time')} *</label>
                  <input
                    type="time"
                    required
                    value={newMeeting.start_time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('form.endTime', 'End Time')} *</label>
                  <input
                    type="time"
                    required
                    value={newMeeting.end_time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Visitor Details */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>External Visitor & Guest Information</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">{t('form.fullName', 'Visitor Full Name')} *</label>
                    <input
                      type="text"
                      required
                      value={newMeeting.visitor_name}
                      onChange={(e) => setNewMeeting({ ...newMeeting, visitor_name: e.target.value })}
                      placeholder={t('placeholder.fullName', 'e.g. Johnathan Miller')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">{t('form.company', 'Organization / Company')}</label>
                    <input
                      type="text"
                      value={newMeeting.visitor_company}
                      onChange={(e) => setNewMeeting({ ...newMeeting, visitor_company: e.target.value })}
                      placeholder={t('placeholder.company', 'e.g. Apex Dynamics Ltd.')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">{t('form.email', 'Email Address')}</label>
                    <input
                      type="email"
                      value={newMeeting.visitor_email}
                      onChange={(e) => setNewMeeting({ ...newMeeting, visitor_email: e.target.value })}
                      placeholder={t('placeholder.email', 'guest@organization.com')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">{t('form.phone', 'Contact Phone')}</label>
                    <input
                      type="tel"
                      value={newMeeting.visitor_phone}
                      onChange={(e) => setNewMeeting({ ...newMeeting, visitor_phone: e.target.value })}
                      placeholder={t('placeholder.phone', '+1 (555) 000-0000')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMeeting.issue_qr_pass}
                    onChange={(e) => setNewMeeting({ ...newMeeting, issue_qr_pass: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                  />
                  <span>{t('form.issueQrPass', 'Automatically issue digital QR Pass')}</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMeeting.send_email_notification}
                    onChange={(e) => setNewMeeting({ ...newMeeting, send_email_notification: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                  />
                  <span>{t('form.sendEmailInvite', 'Dispatch calendar invitation email')}</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition"
                >
                  {t('btn.schedule', 'Confirm & Schedule Meeting')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FULL MEETING DETAILS & MANAGEMENT DRAWER/MODAL   */}
      {/* ========================================================= */}
      {selectedMeeting && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isDark ? 'bg-black/90' : 'bg-slate-950/70'
        }`}>
          <div 
            className={`border rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 ${
              isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
            }`}
            style={{
              backgroundColor: isDark ? '#0c1322' : '#ffffff',
              opacity: 1
            }}
          >
            {/* Header */}
            <div className={`flex items-start justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  #{selectedMeeting.reference_code || selectedMeeting.appointment_number}
                </span>
                <h3 className={`text-xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMeeting.purpose}</h3>
                <div className="flex items-center space-x-2 mt-1.5">
                  {getStatusBadge(selectedMeeting.appointment_status || selectedMeeting.status)}
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatDateTime(selectedMeeting.scheduled_start).date} at {formatDateTime(selectedMeeting.scheduled_start).time}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className={`p-2 rounded-xl transition ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Visitor Box */}
              <div 
                className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
                style={{
                  backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                  opacity: 1
                }}
              >
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Visitor / Guest Details</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {selectedMeeting.visitor_name ? selectedMeeting.visitor_name.charAt(0) : 'V'}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMeeting.visitor_name}</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedMeeting.visitor_company || 'Independent Visitor'}</p>
                  </div>
                </div>
                <div className={`space-y-1 pt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedMeeting.visitor_email || 'Not specified'}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedMeeting.visitor_phone || 'Not specified'}</span>
                  </p>
                </div>
              </div>

              {/* Host & Location Box */}
              <div 
                className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
                style={{
                  backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                  opacity: 1
                }}
              >
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Host & Space Allocation</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {selectedMeeting.host_name ? selectedMeeting.host_name.charAt(0) : 'H'}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMeeting.host_name || 'Department Staff'}</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedMeeting.host_position || 'Staff'}</p>
                  </div>
                </div>
                <div className={`space-y-1 pt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMeeting.room_name || 'Conference Room Alpha'}</span>
                  </p>
                  <p className="flex items-center space-x-2 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Capacity: {selectedMeeting.room_capacity || 10} persons</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Status Action Controls */}
            <div 
              className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
              style={{
                backgroundColor: isDark ? '#111a2e' : '#f8fafc',
                opacity: 1
              }}
            >
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Meeting State & Transitions</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setAppointments(
                      appointments.map((a) =>
                        a.id === selectedMeeting.id
                          ? { ...a, appointment_status: 'IN_PROGRESS', status: 'IN_PROGRESS' }
                          : a
                      )
                    );
                    setSelectedMeeting({ ...selectedMeeting, appointment_status: 'IN_PROGRESS', status: 'IN_PROGRESS' });
                    setSuccessToast('Meeting marked as In-Progress.');
                  }}
                  className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Start Meeting (In-Progress)</span>
                </button>

                <button
                  onClick={() => {
                    setAppointments(
                      appointments.map((a) =>
                        a.id === selectedMeeting.id
                          ? { ...a, appointment_status: 'COMPLETED', status: 'COMPLETED' }
                          : a
                      )
                    );
                    setSelectedMeeting({ ...selectedMeeting, appointment_status: 'COMPLETED', status: 'COMPLETED' });
                    setSuccessToast('Meeting marked as Completed.');
                  }}
                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>

                <button
                  onClick={() => handlePrintMeeting(selectedMeeting)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Pass</span>
                </button>
              </div>
            </div>

            {/* Management Actions */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedForAction(selectedMeeting);
                    setShowReassignModal(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Reassign Host</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedForAction(selectedMeeting);
                    setShowRescheduleModal(true);
                  }}
                  className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedForAction(selectedMeeting);
                    setShowCancelModal(true);
                  }}
                  className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel Meeting</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RESCHEDULE MODAL                                 */}
      {/* ========================================================= */}
      {showRescheduleModal && selectedForAction && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isDark ? 'bg-black/90' : 'bg-slate-950/70'
        }`}>
          <div 
            className={`border rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 ${
              isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
            }`}
            style={{
              backgroundColor: isDark ? '#0c1322' : '#ffffff',
              opacity: 1
            }}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Reschedule Meeting</span>
              </h3>
              <button onClick={() => setShowRescheduleModal(false)} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Rescheduling meeting for <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedForAction.visitor_name}</strong>
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedForAction.purpose}</p>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('form.scheduledDate', 'New Date')} *</label>
                <input
                  type="date"
                  required
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${isDark ? 'border-slate-800 text-slate-100' : 'border-slate-300 text-slate-900'}`}
                  style={{
                    backgroundColor: isDark ? '#080e1a' : '#ffffff',
                    opacity: 1
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('form.startTime', 'New Start Time')} *</label>
                  <input
                    type="time"
                    required
                    value={rescheduleData.start_time}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, start_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${isDark ? 'border-slate-800 text-slate-100' : 'border-slate-300 text-slate-900'}`}
                    style={{
                      backgroundColor: isDark ? '#080e1a' : '#ffffff',
                      opacity: 1
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('form.endTime', 'New End Time')} *</label>
                  <input
                    type="time"
                    required
                    value={rescheduleData.end_time}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, end_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none ${isDark ? 'border-slate-800 text-slate-100' : 'border-slate-300 text-slate-900'}`}
                    style={{
                      backgroundColor: isDark ? '#080e1a' : '#ffffff',
                      opacity: 1
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('form.reason', 'Reason for Rescheduling')}</label>
                <textarea
                  rows={2}
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                  placeholder={t('placeholder.reason', 'e.g. Schedule conflict with department board review...')}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none placeholder-slate-500 ${isDark ? 'border-slate-800 text-slate-100' : 'border-slate-300 text-slate-900'}`}
                  style={{
                    backgroundColor: isDark ? '#080e1a' : '#ffffff',
                    opacity: 1
                  }}
                />
              </div>

              <div className={`flex items-center justify-end space-x-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-900/30"
                >
                  {t('btn.reschedule', 'Confirm Reschedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CANCEL CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {showCancelModal && selectedForAction && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isDark ? 'bg-black/90' : 'bg-slate-950/70'
        }`}>
          <div 
            className={`border rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 ${
              isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
            }`}
            style={{
              backgroundColor: isDark ? '#0c1322' : '#ffffff',
              opacity: 1
            }}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className="text-base font-bold text-rose-400 flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>{t('btn.cancelMeeting', 'Cancel Meeting')}</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Are you sure you want to cancel the meeting with{' '}
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedForAction.visitor_name}</strong>?
              </p>

              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('form.reason', 'Cancellation Reason')} *</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('placeholder.reason', 'Provide reason for host, visitor and compliance logs...')}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none placeholder-slate-500 ${isDark ? 'border-slate-800 text-slate-100' : 'border-slate-300 text-slate-900'}`}
                  style={{
                    backgroundColor: isDark ? '#080e1a' : '#ffffff',
                    opacity: 1
                  }}
                />
              </div>

              <div className={`flex items-center justify-end space-x-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t('btn.keepMeeting', 'Keep Meeting')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-900/30"
                >
                  {t('btn.cancelMeeting', 'Cancel Meeting')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: HOST REASSIGNMENT MODAL                          */}
      {/* ========================================================= */}
      {showReassignModal && selectedForAction && (
        <HostReassignmentModal
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
          request={selectedForAction}
          onSuccess={handleReassignSuccess}
          mode="reassign"
        />
      )}

      {/* Legacy Request Details Modal fallback */}
      <RequestDetailsModal
        isOpen={!!selectedApptIdForDetails}
        onClose={() => setSelectedApptIdForDetails(null)}
        requestId={selectedApptIdForDetails}
      />
    </div>
  );
}
