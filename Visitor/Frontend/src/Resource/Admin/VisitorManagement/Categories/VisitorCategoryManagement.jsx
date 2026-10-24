import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, RefreshCw, Download, FileText, Printer, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight, X, LayoutGrid, CheckCircle2, Clock, Users, ShieldCheck, Trash2, FileCheck, Key, ArrowRight, ArrowLeft, Sparkles, Check, AlertTriangle, UserCheck, Shield } from 'lucide-react';
import { visitorCategoryApi } from '../../../../modules/visitor-management/api/visitorCategoryApi';
import CategoryTable from './components/CategoryTable';
import ConfirmationDialog from '../../Organization/Profile/components/ConfirmationDialog';
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD MATCHING KPI CARD THEMES & STYLING
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_KPI_THEMES = {
    blue: {
        barColor: '#3b82f6',
        hoverBarColor: '#60a5fa',
        darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(30, 58, 138, 0.22) 55%, #0a0f1d 100%)',
        iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    },
    emerald: {
        barColor: '#10b981',
        hoverBarColor: '#34d399',
        darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 78, 59, 0.22) 55%, #0a0f1d 100%)',
        iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    },
    amber: {
        barColor: '#f59e0b',
        hoverBarColor: '#fbbf24',
        darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(120, 53, 15, 0.22) 55%, #0a0f1d 100%)',
        iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    },
    purple: {
        barColor: '#a855f7',
        hoverBarColor: '#c084fc',
        darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(88, 28, 135, 0.22) 55%, #0a0f1d 100%)',
        iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    },
    cyan: {
        barColor: '#06b6d4',
        hoverBarColor: '#22d3ee',
        darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(22, 78, 99, 0.22) 55%, #0a0f1d 100%)',
        iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    }
};
function CategoryKpiCard({ icon, label, value, desc, theme }) {
    const [hovered, setHovered] = useState(false);
    const styles = CATEGORY_KPI_THEMES[theme];
    return (<motion.div whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
            background: hovered ? styles.darkHoverBg : undefined
        }} className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[145px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0b1220] border-slate-800 shadow-xl ${hovered ? 'shadow-2xl border-slate-700' : ''}`}>
      {/* Accent left colored bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2" style={{ backgroundColor: hovered ? styles.hoverBarColor : styles.barColor }}/>

      {/* Glowing radial blur */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 group-hover:opacity-45 transition-opacity duration-500" style={{ backgroundColor: styles.barColor }}/>

      {/* Top row */}
      <div className="flex items-center justify-between z-10">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm ${styles.iconBg}`}>
          {icon}
        </div>
      </div>

      {/* Bottom metric & subtitle */}
      <div className="z-10 mt-2">
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:translate-x-0.5 transition-transform duration-300">
          {value}
        </div>
        <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
          {desc}
        </div>
      </div>
    </motion.div>);
}
const DEFAULT_DOC_OPTIONS = [
    'National ID', 'Passport', 'Driving License', 'Employee ID',
    'Invitation Letter', 'Business License', 'Visa', 'Insurance Certificate',
    'Work Permit', 'Other Supporting Documents'
];
const DEFAULT_LOCATIONS = [
    'Reception', 'Meeting Room', 'Office Area', 'Laboratory',
    'Warehouse', 'Parking Area', 'Server Room', 'Executive Floor',
    'Restricted Area', 'Cafeteria', 'Loading Bay', 'Clinic Area'
];
const DEFAULT_ROLES = [
    'Receptionist', 'Host', 'Department Manager', 'Security Officer',
    'Executive Officer', 'System'
];
const getFreshEmptyForm = (displayOrder = 1) => ({
    category_name: '',
    category_code: '',
    description: '',
    default_visit_duration: '',
    default_duration_minutes: 0,
    max_visit_duration: '',
    max_duration_minutes: 0,
    approval_required: false,
    allow_walkin_visitor: false,
    allow_repeat_visit: false,
    access_level: 'Level 1 (General)',
    status: 'Active',
    display_order: displayOrder,
    appointment_required: false,
    host_approval_required: false,
    department_approval_required: false,
    security_approval_required: false,
    visitor_pass_required: false,
    identity_verification_required: false,
    face_verification_required: false,
    document_verification_required: false,
    escort_required: false,
    vehicle_registration_required: false,
    emergency_contact_required: false,
    documents: [],
    workflows: [],
    access_levels: []
});
const EMPTY_FORM = getFreshEmptyForm(1);
const CATEGORY_PRESETS = [
    {
        name: 'General Visitor',
        code: 'CAT-GEN',
        description: 'Standard walk-in or general inquiry visitor seeking assistance or public access.',
        tag: 'General',
        color: 'from-blue-600 to-sky-600',
        preset: {
            category_name: 'General Visitor',
            category_code: 'CAT-GEN',
            description: 'Standard walk-in or general inquiry visitor seeking assistance or public access.',
            default_visit_duration: '2 Hours',
            default_duration_minutes: 120,
            max_visit_duration: '1 Day',
            max_duration_minutes: 1440,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: true,
            allow_repeat_visit: true,
            appointment_required: false,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Government Issued Photo ID' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Reception Check-In', approver_role: 'Receptionist', is_auto_approved: true }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true }
            ]
        }
    },
    {
        name: 'Business Visitor',
        code: 'BUS-VIS',
        description: 'Corporate meetings, client consults, and commercial partners.',
        tag: 'Corporate',
        color: 'from-blue-600 to-indigo-600',
        preset: {
            category_name: 'Business Visitor',
            category_code: 'BUS-VIS',
            description: 'Corporate meetings, client consults, and commercial partners.',
            default_visit_duration: '2 Hours',
            default_duration_minutes: 120,
            max_visit_duration: '1 Day',
            max_duration_minutes: 1440,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: true,
            allow_repeat_visit: true,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Government Issued Photo ID' },
                { document_type: 'Business License', is_mandatory: false, description: 'Corporate Business Card or ID' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Host Confirmation', approver_role: 'Host', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Meeting Room', is_granted: true },
                { location_name: 'Cafeteria', is_granted: true }
            ]
        }
    },
    {
        name: 'Contractor & Maintenance',
        code: 'CONT-TECH',
        description: 'Technical equipment service, facility builders, and facility vendors.',
        tag: 'Technical',
        color: 'from-emerald-600 to-teal-600',
        preset: {
            category_name: 'Contractor & Maintenance',
            category_code: 'CONT-TECH',
            description: 'Technical equipment service, facility builders, and facility vendors.',
            default_visit_duration: '8 Hours',
            default_duration_minutes: 480,
            max_visit_duration: '7 Days',
            max_duration_minutes: 10080,
            access_level: 'Level 2 (Restricted)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: false,
            allow_repeat_visit: true,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: true,
            security_approval_required: true,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: true,
            vehicle_registration_required: true,
            emergency_contact_required: true,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'National Identification / Work License' },
                { document_type: 'Work Permit', is_mandatory: true, description: 'Contractor Work Order / Safety Clearance' },
                { document_type: 'Insurance Certificate', is_mandatory: false, description: 'Third Party Liability Insurance' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Facility Supervisor Check', approver_role: 'Host', is_auto_approved: false },
                { step_order: 2, step_name: 'Safety & Security Verification', approver_role: 'Security Officer', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Loading Bay', is_granted: true },
                { location_name: 'Warehouse', is_granted: true },
                { location_name: 'Laboratory', is_granted: true }
            ]
        }
    },
    {
        name: 'VIP Guest & Delegate',
        code: 'VIP-DEL',
        description: 'Executive leadership, foreign dignitaries, and high-security delegations.',
        tag: 'Executive',
        color: 'from-amber-500 to-rose-600',
        preset: {
            category_name: 'VIP Guest & Delegate',
            category_code: 'VIP-DEL',
            description: 'Executive leadership, foreign dignitaries, and high-security delegations.',
            default_visit_duration: '4 Hours',
            default_duration_minutes: 240,
            max_visit_duration: '3 Days',
            max_duration_minutes: 4320,
            access_level: 'Level 3 (Limited)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: false,
            allow_repeat_visit: true,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: true,
            security_approval_required: true,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: true,
            document_verification_required: true,
            escort_required: true,
            vehicle_registration_required: true,
            emergency_contact_required: true,
            documents: [
                { document_type: 'Passport', is_mandatory: true, description: 'Diplomatic or International Passport' },
                { document_type: 'Invitation Letter', is_mandatory: true, description: 'Official Board / Executive Invitation' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Host Clearance', approver_role: 'Host', is_auto_approved: false },
                { step_order: 2, step_name: 'Security Protocol Check', approver_role: 'Security Officer', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Meeting Room', is_granted: true },
                { location_name: 'Executive Floor', is_granted: true },
                { location_name: 'Cafeteria', is_granted: true }
            ]
        }
    },
    {
        name: 'Vendor / Supplier',
        code: 'VEN-SUPP',
        description: 'Material suppliers, logistics delivery operators, merchandise drop-offs, and supply vendors.',
        tag: 'Logistics',
        color: 'from-emerald-600 to-green-600',
        preset: {
            category_name: 'Vendor / Supplier',
            category_code: 'VEN-SUPP',
            description: 'Material suppliers, logistics delivery operators, merchandise drop-offs, and supply vendors.',
            default_visit_duration: '1 Hour',
            default_duration_minutes: 60,
            max_visit_duration: '4 Hours',
            max_duration_minutes: 240,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: true,
            allow_repeat_visit: true,
            appointment_required: false,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: false,
            vehicle_registration_required: true,
            emergency_contact_required: false,
            documents: [
                { document_type: 'Driving License', is_mandatory: true, description: 'Driver / Courier Operator ID' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Warehouse Receiving Check', approver_role: 'Receptionist', is_auto_approved: true }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Loading Bay', is_granted: true }
            ]
        }
    },
    {
        name: 'Government Official',
        code: 'GOV-OFF',
        description: 'Regulatory compliance inspectors, tax and audit representatives, and official dignitaries.',
        tag: 'Government',
        color: 'from-cyan-600 to-blue-700',
        preset: {
            category_name: 'Government Official',
            category_code: 'GOV-OFF',
            description: 'Regulatory compliance inspectors, tax and audit representatives, and official dignitaries.',
            default_visit_duration: '4 Hours',
            default_duration_minutes: 240,
            max_visit_duration: '2 Days',
            max_duration_minutes: 2880,
            access_level: 'Level 3 (Restricted)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: false,
            allow_repeat_visit: true,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: true,
            security_approval_required: true,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: true,
            vehicle_registration_required: true,
            emergency_contact_required: true,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Official Government Badge' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Protocol Verification', approver_role: 'Security Officer', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Meeting Room', is_granted: true },
                { location_name: 'Executive Floor', is_granted: true }
            ]
        }
    },
    {
        name: 'Interview Candidate',
        code: 'HR-INT',
        description: 'Talent recruitment, candidate assessment, and human resources interviews.',
        tag: 'Recruitment',
        color: 'from-purple-600 to-indigo-600',
        preset: {
            category_name: 'Interview Candidate',
            category_code: 'HR-INT',
            description: 'Talent recruitment, candidate assessment, and human resources interviews.',
            default_visit_duration: '2 Hours',
            default_duration_minutes: 120,
            max_visit_duration: '4 Hours',
            max_duration_minutes: 240,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: false,
            allow_repeat_visit: false,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Government Issued Photo ID' },
                { document_type: 'Invitation Letter', is_mandatory: false, description: 'HR Interview Email or Schedule Notice' }
            ],
            workflows: [
                { step_order: 1, step_name: 'HR Host Check-In', approver_role: 'Host', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Meeting Room', is_granted: true }
            ]
        }
    },
    {
        name: 'Client / Customer',
        code: 'CLI-CUST',
        description: 'Direct clients, retail and corporate account holders, product demonstrations, and consults.',
        tag: 'Client',
        color: 'from-indigo-600 to-blue-600',
        preset: {
            category_name: 'Client / Customer',
            category_code: 'CLI-CUST',
            description: 'Direct clients, retail and corporate account holders, product demonstrations, and consults.',
            default_visit_duration: '2 Hours',
            default_duration_minutes: 120,
            max_visit_duration: '1 Day',
            max_duration_minutes: 1440,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: true,
            allow_repeat_visit: true,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Government Issued Photo ID' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Account Rep Clearance', approver_role: 'Host', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Meeting Room', is_granted: true }
            ]
        }
    },
    {
        name: 'Guest',
        code: 'GST-VIS',
        description: 'Personal guest of staff members, social visits, and informal acquaintances.',
        tag: 'Guest',
        color: 'from-rose-500 to-pink-600',
        preset: {
            category_name: 'Guest',
            category_code: 'GST-VIS',
            description: 'Personal guest of staff members, social visits, and informal acquaintances.',
            default_visit_duration: '1 Hour',
            default_duration_minutes: 60,
            max_visit_duration: '3 Hours',
            max_duration_minutes: 180,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: true,
            allow_repeat_visit: true,
            appointment_required: false,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: false,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Government Issued Photo ID' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Staff Host Sign-In', approver_role: 'Host', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Cafeteria', is_granted: true }
            ]
        }
    },
    {
        name: 'Student / Intern',
        code: 'STU-INT',
        description: 'Academic student tours, internships, university researchers, and educational visitors.',
        tag: 'Academic',
        color: 'from-teal-600 to-cyan-600',
        preset: {
            category_name: 'Student / Intern',
            category_code: 'STU-INT',
            description: 'Academic student tours, internships, university researchers, and educational visitors.',
            default_visit_duration: '4 Hours',
            default_duration_minutes: 240,
            max_visit_duration: '1 Day',
            max_duration_minutes: 1440,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: false,
            allow_repeat_visit: true,
            appointment_required: true,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: true,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Student ID or Passport' }
            ],
            workflows: [
                { step_order: 1, step_name: 'Academic Coordinator Clearance', approver_role: 'Host', is_auto_approved: false }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true },
                { location_name: 'Meeting Room', is_granted: true }
            ]
        }
    },
    {
        name: 'Other',
        code: 'OTH-VIS',
        description: 'General purpose or custom visitor categorization not covered by standard classifications.',
        tag: 'Other',
        color: 'from-slate-600 to-zinc-700',
        preset: {
            category_name: 'Other',
            category_code: 'OTH-VIS',
            description: 'General purpose or custom visitor categorization not covered by standard classifications.',
            default_visit_duration: '1 Hour',
            default_duration_minutes: 60,
            max_visit_duration: '4 Hours',
            max_duration_minutes: 240,
            access_level: 'Level 1 (General)',
            status: 'Active',
            approval_required: true,
            allow_walkin_visitor: true,
            allow_repeat_visit: true,
            appointment_required: false,
            host_approval_required: true,
            department_approval_required: false,
            security_approval_required: false,
            visitor_pass_required: true,
            identity_verification_required: true,
            face_verification_required: false,
            document_verification_required: false,
            escort_required: false,
            vehicle_registration_required: false,
            emergency_contact_required: false,
            documents: [
                { document_type: 'National ID', is_mandatory: true, description: 'Government Issued Photo ID' }
            ],
            workflows: [
                { step_order: 1, step_name: 'General Clearance', approver_role: 'Receptionist', is_auto_approved: true }
            ],
            access_levels: [
                { location_name: 'Reception', is_granted: true }
            ]
        }
    }
];
export default function VisitorCategoryManagement() {
    // View mode: 'list' for management dashboard, 'builder' for step-by-step form builder
    const [viewMode, setViewMode] = useState('list');
    const [currentStep, setCurrentStep] = useState(1);
    // Data states
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({
        totalCategories: 0, activeCategories: 0, approvalRequired: 0, walkinAllowed: 0, totalRequiredDocs: 0
    });
    const [loading, setLoading] = useState(true);
    // Pagination & Sorting
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('display_order');
    const [sortOrder, setSortOrder] = useState('ASC');
    // Selected category for inspection
    const [selectedCategory, setSelectedCategory] = useState(null);
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterAccess, setFilterAccess] = useState('');
    const [filterApproval, setFilterApproval] = useState('');
    // Confirmation dialogs
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiving, setArchiving] = useState(false);
    // Toast
    const [toast, setToast] = useState(null);
    // Builder Form State
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [customZoneInput, setCustomZoneInput] = useState('');
    const [step1Errors, setStep1Errors] = useState({});
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const isArchivedParam = filterStatus === 'Archived' ? 'true' : 'false';
            const statusParam = filterStatus === 'Archived' ? undefined : (filterStatus || undefined);
            const [catRes, statRes] = await Promise.all([
                visitorCategoryApi.getAll({
                    search: search.trim() || undefined,
                    status: statusParam,
                    approval_required: filterApproval || undefined,
                    access_level: filterAccess || undefined,
                    is_archived: isArchivedParam,
                    page, limit,
                    sort_by: sortBy, sort_order: sortOrder
                }),
                visitorCategoryApi.getStats()
            ]);
            const fetchedCats = catRes.data || [];
            setCategories(fetchedCats);
            if (catRes.pagination) {
                setTotalCount(catRes.pagination.total || 0);
                setTotalPages(catRes.pagination.totalPages || 0);
            }
            if (statRes.data)
                setStats(statRes.data);
            if (fetchedCats.length > 0) {
                setSelectedCategory(prev => {
                    if (prev && fetchedCats.some((c) => c.id === prev.id))
                        return prev;
                    return fetchedCats[0];
                });
            }
        }
        catch (err) {
            console.error('Error fetching categories:', err);
        }
        finally {
            setLoading(false);
        }
    }, [search, filterStatus, filterApproval, filterAccess, page, limit, sortBy, sortOrder]);
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);
    // Check URL query parameters for edit action
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editCategoryId');
        if (editId) {
            visitorCategoryApi.getById(Number(editId))
                .then(res => {
                if (res.data) {
                    setEditingCategory(res.data);
                    setFormData(res.data);
                    setCurrentStep(1);
                    setViewMode('builder');
                }
            })
                .catch(console.error);
        }
    }, []);
    const handleNav = (targetView, catId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', targetView);
        if (catId)
            params.set('categoryId', String(catId));
        window.location.search = `?${params.toString()}`;
    };
    const handleViewStandaloneDetails = (cat) => {
        handleNav('visitor_category_details', cat.id);
    };
    // ── Helper to reset all form inputs & old state ──
    const resetFormState = () => {
        setEditingCategory(null);
        setFormData(getFreshEmptyForm(categories.length + 1));
        setCustomZoneInput('');
        setStep1Errors({});
        setCurrentStep(1);
    };
    const handleCancelBuilder = () => {
        resetFormState();
        setViewMode('list');
    };
    // ── Open Builder for New Category (clears old data) ──
    const handleOpenAdd = (presetData) => {
        setEditingCategory(null);
        const fresh = getFreshEmptyForm(categories.length + 1);
        if (presetData) {
            setFormData({
                ...fresh,
                ...JSON.parse(JSON.stringify(presetData)),
                display_order: categories.length + 1
            });
        }
        else {
            setFormData(fresh);
        }
        setCustomZoneInput('');
        setStep1Errors({});
        setCurrentStep(1);
        setViewMode('builder');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // ── Open Builder for Edit Category ──
    const handleOpenEdit = async (cat) => {
        try {
            const res = await visitorCategoryApi.getById(cat.id);
            setEditingCategory(res.data || cat);
            setFormData(res.data || cat);
        }
        catch {
            setEditingCategory(cat);
            setFormData(cat);
        }
        setStep1Errors({});
        setCurrentStep(1);
        setViewMode('builder');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // ── Load Preset into Builder ──
    const handleApplyPreset = (preset) => {
        setFormData(prev => ({
            ...prev,
            ...preset,
            category_name: preset.category_name || prev.category_name,
            category_code: preset.category_code || prev.category_code,
            display_order: prev.display_order || categories.length + 1
        }));
        showToast(`Loaded preset template: ${preset.category_name}`, 'success');
    };
    // ── Validate Step 1 Before Next ──
    const validateStep1 = () => {
        const errors = {};
        if (!formData.category_name?.trim()) {
            errors.name = 'Category Name is required.';
        }
        if (!formData.category_code?.trim()) {
            errors.code = 'Category Code is required.';
        }
        setStep1Errors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!validateStep1()) {
                showToast('Please fill in required fields on Step 1.', 'error');
                return;
            }
        }
        setCurrentStep(prev => Math.min(6, prev + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // ── Save Category (Create or Update) ──
    const handleSave = async (e) => {
        if (e)
            e.preventDefault();
        if (!validateStep1()) {
            setCurrentStep(1);
            showToast('Category Name and Code are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editingCategory) {
                const res = await visitorCategoryApi.update(editingCategory.id, formData);
                showToast(res.message || 'Visitor category updated successfully.');
                if (res.data)
                    setSelectedCategory(res.data);
            }
            else {
                const res = await visitorCategoryApi.create(formData);
                showToast(res.message || 'Visitor category created successfully.');
                if (res.data)
                    setSelectedCategory(res.data);
            }
            // Reset form state and clear all old inputs
            resetFormState();
            setViewMode('list');
            fetchCategories();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Failed to save visitor category.', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    // ── Archive / Restore ──
    const handleArchiveConfirm = async () => {
        if (!archiveTarget)
            return;
        setArchiving(true);
        try {
            if (archiveTarget.status === 'Archived' || archiveTarget.is_archived) {
                await visitorCategoryApi.restore(archiveTarget.id);
                showToast('Category restored successfully.');
            }
            else {
                await visitorCategoryApi.archive(archiveTarget.id);
                showToast('Category archived successfully.');
            }
            setArchiveTarget(null);
            fetchCategories();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Action failed.', 'error');
        }
        finally {
            setArchiving(false);
        }
    };
    // ── Delete ──
    const handleDeleteConfirm = async () => {
        if (!deleteTarget)
            return;
        setDeleting(true);
        try {
            await visitorCategoryApi.delete(deleteTarget.id);
            showToast('Category deleted successfully.');
            setDeleteTarget(null);
            fetchCategories();
        }
        catch (err) {
            showToast(err.response?.data?.message || 'Cannot delete category in use.', 'error');
        }
        finally {
            setDeleting(false);
        }
    };
    // ── CSV Export ──
    const handleExportCSV = () => {
        const headers = ['Name', 'Code', 'Description', 'Default Duration', 'Max Duration', 'Approval', 'Access Level', 'Status'];
        const rows = categories.map(c => [c.category_name, c.category_code, c.description || '', c.default_visit_duration, c.max_visit_duration, c.approval_required ? 'Yes' : 'No', c.access_level, c.status].map(v => `"${v}"`));
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `Visitor_Categories_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    const handlePrint = () => {
        window.print();
    };
    const clearFilters = () => {
        setSearch('');
        setFilterStatus('');
        setFilterAccess('');
        setFilterApproval('');
        setPage(1);
    };
    // Helpers for docs, workflows, access levels
    const addDocRow = () => setFormData(p => ({
        ...p,
        documents: [...(p.documents || []), { document_type: 'National ID', is_mandatory: true, description: '' }]
    }));
    const removeDocRow = (i) => setFormData(p => ({
        ...p,
        documents: (p.documents || []).filter((_, idx) => idx !== i)
    }));
    const addWfRow = () => setFormData(p => {
        const wfs = p.workflows || [];
        return {
            ...p,
            workflows: [...wfs, { step_order: wfs.length + 1, step_name: 'Approval Step', approver_role: 'Department Manager', is_auto_approved: false }]
        };
    });
    const removeWfRow = (i) => setFormData(p => ({
        ...p,
        workflows: (p.workflows || []).filter((_, idx) => idx !== i).map((w, idx) => ({ ...w, step_order: idx + 1 }))
    }));
    const toggleLocation = (loc) => setFormData(p => {
        const curr = p.access_levels || [];
        return {
            ...p,
            access_levels: curr.find(l => l.location_name === loc)
                ? curr.filter(l => l.location_name !== loc)
                : [...curr, { location_name: loc, is_granted: true }]
        };
    });
    const BUILDER_STEPS = [
        { num: 1, title: 'Basic Info', desc: 'Identity & Durations', icon: FileText },
        { num: 2, title: 'Rules', desc: 'Security & Verification', icon: ShieldCheck },
        { num: 3, title: 'Documents', desc: `Required (${formData.documents?.length || 0})`, icon: FileCheck },
        { num: 4, title: 'Workflows', desc: `Approval (${formData.workflows?.length || 0})`, icon: Users },
        { num: 5, title: 'Access Zones', desc: `Locations (${formData.access_levels?.length || 0})`, icon: Key },
        { num: 6, title: 'Review & Publish', desc: 'Verify & Save', icon: CheckCircle2 }
    ];
    return (<div className="space-y-6">
      {/* Toast Notification */}
      {toast && (<div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xl animate-fadeIn ${toast.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <AlertTriangle className="w-4 h-4 text-rose-400"/>}
            <span>{toast.message}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-3.5 h-3.5"/>
          </button>
        </div>)}

      {/* ════════════════════════════════════════════════════════════════════════
            VIEW MODE 1: STEP-BY-STEP CATEGORY FORM BUILDER
           ════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'builder' ? (<div className="space-y-6">
          {/* Builder Top Banner & Navigation */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0b1220] border border-slate-800 p-7 shadow-2xl transition-colors">
            {/* TOP CURVED WAVE SVG ACCENT */}
            <div className="absolute top-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveBuilder)"/>
                <defs>
                  <linearGradient id="topWaveBuilder" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0f3875"/>
                    <stop offset="50%" stopColor="#1e50a2"/>
                    <stop offset="100%" stopColor="#00a0e9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={handleCancelBuilder} className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all shadow-md cursor-pointer">
                  <ArrowLeft className="w-4 h-4 text-blue-400"/>
                  <span>Back to Categories</span>
                </motion.button>
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
                    Visitor Category Builder • Step {currentStep} of 6
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-0">
                    {editingCategory ? `Edit Category: ${editingCategory.category_name}` : 'Create New Visitor Category'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {BUILDER_STEPS.map(step => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                return (<button key={step.num} type="button" onClick={() => {
                        if (step.num === 1 || validateStep1()) {
                            setCurrentStep(step.num);
                        }
                        else {
                            showToast('Please complete Step 1 required fields first.', 'error');
                        }
                    }} className={`text-left p-3 rounded-2xl border transition-all flex flex-col gap-1.5 relative ${isActive
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-600/10'
                        : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300 hover:bg-slate-900'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono ${isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'}`}>
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]"/> : step.num}
                        </span>
                        <StepIcon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}/>
                      </div>
                      <div>
                        <div className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {step.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-semibold">
                          {step.desc}
                        </div>
                      </div>
                      {isActive && (<span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full"/>)}
                    </button>);
            })}
              </div>
            </div>
          </div>

          {/* Builder Step Form Card */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* STEP 1: BASIC INFO & IDENTITY */}
            {currentStep === 1 && (<div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400"/> Step 1: General Identity & Duration Limits
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-0">
                    Define the core nomenclature, tracking code, duration allowances, and security clearance tier.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                      Category Name <span className="text-rose-400">*</span>
                    </label>
                    <input type="text" required placeholder="e.g. Business Visitor, VIP Delegate, Contractor" value={formData.category_name || ''} onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({
                        ...p,
                        category_name: val,
                        category_code: !p.category_code || p.category_code === ''
                            ? val.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 10).toUpperCase()
                            : p.category_code
                    }));
                    if (step1Errors.name)
                        setStep1Errors(prev => ({ ...prev, name: undefined }));
                }} className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all ${step1Errors.name ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-800 focus:border-indigo-500'}`}/>
                    {step1Errors.name && (<span className="text-[11px] text-rose-400 font-semibold mt-1 block">{step1Errors.name}</span>)}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                      Category Code <span className="text-rose-400">*</span>
                    </label>
                    <input type="text" required placeholder="e.g. BUS-VIS, VIP-DEL, CONT-TECH" value={formData.category_code || ''} onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setFormData(p => ({ ...p, category_code: val }));
                    if (step1Errors.code)
                        setStep1Errors(prev => ({ ...prev, code: undefined }));
                }} className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-xs font-mono font-bold text-indigo-300 placeholder-slate-500 outline-none uppercase transition-all ${step1Errors.code ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-800 focus:border-indigo-500'}`}/>
                    {step1Errors.code && (<span className="text-[11px] text-rose-400 font-semibold mt-1 block">{step1Errors.code}</span>)}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                      Category Purpose & Description
                    </label>
                    <textarea rows={3} placeholder="Describe the target audience, purpose of visits under this category, and any relevant notes..." value={formData.description || ''} onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({ ...p, description: val }));
                }} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none"/>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                      Default Visit Duration
                    </label>
                    <input type="text" placeholder="e.g. 2 Hours, 4 Hours, 1 Day" value={formData.default_visit_duration || ''} onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({ ...p, default_visit_duration: val }));
                }} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none"/>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                      Maximum Visit Duration
                    </label>
                    <input type="text" placeholder="e.g. 1 Day, 3 Days, 7 Days" value={formData.max_visit_duration || ''} onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({ ...p, max_visit_duration: val }));
                }} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none"/>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                      Security Access Tier
                    </label>
                    <select value={formData.access_level || 'Level 1 (General)'} onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({ ...p, access_level: val }));
                }} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white outline-none">
                      <option value="Level 1 (General)">Level 1 (General Access)</option>
                      <option value="Level 2 (Restricted)">Level 2 (Restricted Zones)</option>
                      <option value="Level 3 (Limited)">Level 3 (Limited Access)</option>
                      <option value="Level 4 (High Security)">Level 4 (High Security Clearance)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                        Status
                      </label>
                      <select value={formData.status || 'Active'} onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({ ...p, status: val }));
                }} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white outline-none">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5 block">
                        Display Order
                      </label>
                      <input type="number" min={1} value={formData.display_order ?? ''} onChange={e => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    setFormData(p => ({ ...p, display_order: val }));
                }} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white outline-none"/>
                    </div>
                  </div>
                </div>

                {/* Core Policy Switches */}
                <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'approval_required', label: 'Require Approval Workflow', desc: 'Must be formally approved before issuance' },
                    { key: 'allow_walkin_visitor', label: 'Allow Walk-in Registration', desc: 'Can be selected at reception kiosks' },
                    { key: 'allow_repeat_visit', label: 'Allow Repeat Multi-Visit Passes', desc: 'Passes valid across recurring appointments' }
                ].map(f => (<label key={f.key} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${formData[f.key]
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'}`}>
                      <input type="checkbox" checked={Boolean(formData[f.key])} onChange={e => {
                        const checked = e.target.checked;
                        setFormData(p => ({ ...p, [f.key]: checked }));
                    }} className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                      <div>
                        <div className="text-xs font-bold text-white">{f.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                      </div>
                    </label>))}
                </div>
              </div>)}

            {/* STEP 2: SECURITY & COMPLIANCE RULES */}
            {currentStep === 2 && (<div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400"/> Step 2: Security & Check-In Enforcement Rules
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-0">
                    Configure automated compliance checks, required approvals, badge requirements, and safety policies.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Scheduling & Approvals */}
                  <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                      <Clock className="w-4 h-4"/> Scheduling & Approvals
                    </div>
                    {[
                    { key: 'appointment_required', label: 'Appointment Required', desc: 'Pre-scheduled booking is mandatory' },
                    { key: 'host_approval_required', label: 'Host Approval Required', desc: 'Host employee must sign off' },
                    { key: 'department_approval_required', label: 'Department Approval Required', desc: 'Manager must review entry' },
                    { key: 'security_approval_required', label: 'Security Officer Approval', desc: 'Guard station check is mandatory' },
                ].map(r => (<label key={r.key} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors">
                        <input type="checkbox" checked={Boolean(formData[r.key])} onChange={e => setFormData(p => ({ ...p, [r.key]: e.target.checked }))} className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                        <div>
                          <div className="text-xs font-bold text-white">{r.label}</div>
                          <div className="text-[10px] text-slate-400">{r.desc}</div>
                        </div>
                      </label>))}
                  </div>

                  {/* Card 2: Identity & Badging */}
                  <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                      <UserCheck className="w-4 h-4"/> Identity & Verification
                    </div>
                    {[
                    { key: 'visitor_pass_required', label: 'Visitor Pass / Badge', desc: 'Physical or QR badge badge printed' },
                    { key: 'identity_verification_required', label: 'Identity Verification', desc: 'Verify physical government ID' },
                    { key: 'face_verification_required', label: 'Face Biometrics Verification', desc: 'Capture facial live scan' },
                    { key: 'document_verification_required', label: 'Document Verification', desc: 'Scan supporting documents' },
                ].map(r => (<label key={r.key} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors">
                        <input type="checkbox" checked={Boolean(formData[r.key])} onChange={e => setFormData(p => ({ ...p, [r.key]: e.target.checked }))} className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"/>
                        <div>
                          <div className="text-xs font-bold text-white">{r.label}</div>
                          <div className="text-[10px] text-slate-400">{r.desc}</div>
                        </div>
                      </label>))}
                  </div>

                  {/* Card 3: Safety & Facility */}
                  <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                      <Shield className="w-4 h-4"/> Safety & Escort Rules
                    </div>
                    {[
                    { key: 'escort_required', label: 'Staff Escort Required', desc: 'Must be accompanied by staff at all times' },
                    { key: 'vehicle_registration_required', label: 'Vehicle Registration', desc: 'Log license plate & parking stall' },
                    { key: 'emergency_contact_required', label: 'Emergency Contact Info', desc: 'Collect next of kin phone number' },
                ].map(r => (<label key={r.key} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors">
                        <input type="checkbox" checked={Boolean(formData[r.key])} onChange={e => setFormData(p => ({ ...p, [r.key]: e.target.checked }))} className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"/>
                        <div>
                          <div className="text-xs font-bold text-white">{r.label}</div>
                          <div className="text-[10px] text-slate-400">{r.desc}</div>
                        </div>
                      </label>))}
                  </div>
                </div>
              </div>)}

            {/* STEP 3: REQUIRED DOCUMENTS */}
            {currentStep === 3 && (<div className="space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-teal-400"/> Step 3: Required Documentation
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-0">
                      Specify which files visitors must present or upload during onboarding under this category.
                    </p>
                  </div>
                  <button type="button" onClick={addDocRow} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20">
                    <Plus className="w-4 h-4"/> Add Document Requirement
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.documents || []).length > 0 ? ((formData.documents || []).map((doc, idx) => (<div key={idx} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Document Type</label>
                          <select value={doc.document_type} onChange={e => {
                        const val = e.target.value;
                        setFormData(p => {
                            const u = [...(p.documents || [])];
                            u[idx] = { ...u[idx], document_type: val };
                            return { ...p, documents: u };
                        });
                    }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none">
                            {DEFAULT_DOC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>

                        <div className="md:col-span-5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description / Instructions</label>
                          <input type="text" placeholder="e.g. Must be non-expired with clear portrait photo" value={doc.description || ''} onChange={e => {
                        const val = e.target.value;
                        setFormData(p => {
                            const u = [...(p.documents || [])];
                            u[idx] = { ...u[idx], description: val };
                            return { ...p, documents: u };
                        });
                    }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none"/>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Requirement</label>
                          <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <input type="checkbox" checked={doc.is_mandatory} onChange={e => {
                        const checked = e.target.checked;
                        setFormData(p => {
                            const u = [...(p.documents || [])];
                            u[idx] = { ...u[idx], is_mandatory: checked };
                            return { ...p, documents: u };
                        });
                    }} className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 h-4 w-4"/>
                            <span className={`text-xs font-bold ${doc.is_mandatory ? 'text-teal-400' : 'text-slate-400'}`}>
                              {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </label>
                        </div>

                        <div className="md:col-span-1 text-right">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 md:invisible">Action</label>
                          <button type="button" onClick={() => removeDocRow(idx)} className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors" title="Remove document requirement">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>))) : (<div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-600"/>
                      <p className="font-bold text-slate-400 mb-1">No documents required for this category</p>
                      <p className="text-[11px]">Visitors under this category can check in without uploading identification files.</p>
                      <button type="button" onClick={addDocRow} className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 text-xs font-bold border border-slate-800">
                        + Add Document
                      </button>
                    </div>)}
                </div>
              </div>)}

            {/* STEP 4: APPROVAL WORKFLOW PIPELINE */}
            {currentStep === 4 && (<div className="space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400"/> Step 4: Approval Workflow Pipeline
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-0">
                      Configure multi-tier approval sequences required before visitor arrival badges are confirmed.
                    </p>
                  </div>
                  <button type="button" onClick={addWfRow} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20">
                    <Plus className="w-4 h-4"/> Add Workflow Stage
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.workflows || []).length > 0 ? ((formData.workflows || []).map((wf, idx) => (<div key={idx} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-1 text-center">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-mono font-bold flex items-center justify-center mx-auto">
                            #{wf.step_order}
                          </span>
                        </div>

                        <div className="md:col-span-5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stage Name</label>
                          <input type="text" placeholder="e.g. Host Employee Sign-off, Department Review" value={wf.step_name} onChange={e => {
                        const val = e.target.value;
                        setFormData(p => {
                            const u = [...(p.workflows || [])];
                            u[idx] = { ...u[idx], step_name: val };
                            return { ...p, workflows: u };
                        });
                    }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none"/>
                        </div>

                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Approver Role</label>
                          <select value={wf.approver_role} onChange={e => {
                        const val = e.target.value;
                        setFormData(p => {
                            const u = [...(p.workflows || [])];
                            u[idx] = { ...u[idx], approver_role: val };
                            return { ...p, workflows: u };
                        });
                    }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none">
                            {DEFAULT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>

                        <div className="md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Auto</label>
                          <label className="flex items-center gap-1.5 cursor-pointer mt-1" title="Automatically approve if no dispute">
                            <input type="checkbox" checked={wf.is_auto_approved} onChange={e => {
                        const checked = e.target.checked;
                        setFormData(p => {
                            const u = [...(p.workflows || [])];
                            u[idx] = { ...u[idx], is_auto_approved: checked };
                            return { ...p, workflows: u };
                        });
                    }} className="rounded border-slate-700 text-indigo-600 h-4 w-4"/>
                            <span className="text-[11px] font-semibold text-slate-400">Auto</span>
                          </label>
                        </div>

                        <div className="md:col-span-1 text-right">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 md:invisible">Action</label>
                          <button type="button" onClick={() => removeWfRow(idx)} className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors" title="Remove approval step">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>))) : (<div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-600"/>
                      <p className="font-bold text-slate-400 mb-1">No approval workflow assigned</p>
                      <p className="text-[11px]">Visitor requests under this category will automatically be granted entry without human sign-off.</p>
                      <button type="button" onClick={addWfRow} className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 text-xs font-bold border border-slate-800">
                        + Add Workflow Stage
                      </button>
                    </div>)}
                </div>
              </div>)}

            {/* STEP 5: FACILITY ACCESS ZONES */}
            {currentStep === 5 && (<div className="space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-5 h-5 text-purple-400"/> Step 5: Facility Access & Zone Permissions
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-0">
                      Toggle the physical rooms, floors, and secured facilities visitors under this category can access.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => {
                    setFormData(p => {
                        const allLocs = Array.from(new Set([...DEFAULT_LOCATIONS, ...(p.access_levels || []).map(a => a.location_name)]));
                        return {
                            ...p,
                            access_levels: allLocs.map(l => ({ location_name: l, is_granted: true }))
                        };
                    });
                }} className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors">
                      Select All
                    </button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, access_levels: [] }))} className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors">
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from(new Set([...DEFAULT_LOCATIONS, ...(formData.access_levels || []).map(a => a.location_name)])).map(loc => {
                    const isGranted = (formData.access_levels || []).some(a => a.location_name === loc);
                    const isCustom = !DEFAULT_LOCATIONS.includes(loc);
                    return (<div key={loc} onClick={() => toggleLocation(loc)} className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between select-none ${isGranted
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`w-2 h-2 rounded-full ${isGranted ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'}`}/>
                          <span className="text-xs font-bold truncate">{loc}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isGranted && <ShieldCheck className="w-4 h-4 text-emerald-400"/>}
                          {isCustom && (<button type="button" onClick={e => {
                                e.stopPropagation();
                                setFormData(p => ({
                                    ...p,
                                    access_levels: (p.access_levels || []).filter(a => a.location_name !== loc)
                                }));
                            }} className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400" title="Delete custom zone">
                              <X className="w-3.5 h-3.5"/>
                            </button>)}
                        </div>
                      </div>);
                })}
                </div>

                {/* Add Custom Location Input */}
                <div className="pt-4 border-t border-slate-800">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 block">
                    Add Custom Physical Area / Zone
                  </label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. Server Room B, Executive Terrace, R&D Workshop..." value={customZoneInput} onChange={e => setCustomZoneInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customZoneInput.trim()) {
                            const trimmed = customZoneInput.trim();
                            setFormData(p => ({
                                ...p,
                                access_levels: [...(p.access_levels || []).filter(a => a.location_name !== trimmed), { location_name: trimmed, is_granted: true }]
                            }));
                            setCustomZoneInput('');
                        }
                    }
                }} className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none"/>
                    <button type="button" onClick={() => {
                    if (customZoneInput.trim()) {
                        const trimmed = customZoneInput.trim();
                        setFormData(p => ({
                            ...p,
                            access_levels: [...(p.access_levels || []).filter(a => a.location_name !== trimmed), { location_name: trimmed, is_granted: true }]
                        }));
                        setCustomZoneInput('');
                    }
                }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all">
                      <Plus className="w-4 h-4"/> Add Zone
                    </button>
                  </div>
                </div>
              </div>)}

            {/* STEP 6: REVIEW & PUBLISH */}
            {currentStep === 6 && (<div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400"/> Step 6: Final Review & Publish Category
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-0">
                    Verify all parameters, enforced compliance rules, and access privileges before publishing this category.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Summary Card 1: Identity */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Category Identity</span>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-black text-white">{formData.category_name || 'Untitled Category'}</div>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {formData.category_code || 'CODE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{formData.description || 'No description provided.'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                      <div><span className="text-slate-500 text-[10px] block">Default Duration</span><strong className="text-white">{formData.default_visit_duration}</strong></div>
                      <div><span className="text-slate-500 text-[10px] block">Max Duration</span><strong className="text-white">{formData.max_visit_duration}</strong></div>
                      <div><span className="text-slate-500 text-[10px] block">Security Level</span><strong className="text-indigo-300">{formData.access_level}</strong></div>
                      <div><span className="text-slate-500 text-[10px] block">Status</span><strong className="text-emerald-400">{formData.status}</strong></div>
                    </div>
                  </div>

                  {/* Summary Card 2: Security Rules */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Enforced Security Rules</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                    { key: 'appointment_required', label: 'Appointment Required' },
                    { key: 'host_approval_required', label: 'Host Approval' },
                    { key: 'department_approval_required', label: 'Department Approval' },
                    { key: 'security_approval_required', label: 'Security Approval' },
                    { key: 'visitor_pass_required', label: 'Visitor Pass' },
                    { key: 'identity_verification_required', label: 'Identity Verification' },
                    { key: 'face_verification_required', label: 'Face Scan' },
                    { key: 'document_verification_required', label: 'Document Verification' },
                    { key: 'escort_required', label: 'Staff Escort' },
                    { key: 'vehicle_registration_required', label: 'Vehicle Registration' },
                    { key: 'emergency_contact_required', label: 'Emergency Contact' },
                ].filter(r => formData[r.key]).map(r => (<span key={r.key} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3"/> {r.label}
                        </span>))}
                    </div>
                  </div>

                  {/* Summary Card 3: Documents */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      Required Documents ({(formData.documents || []).length})
                    </span>
                    <div className="space-y-1">
                      {(formData.documents || []).map((d, i) => (<div key={i} className="text-xs flex items-center justify-between text-slate-300">
                          <span>{d.document_type}</span>
                          <span className={`text-[10px] font-bold ${d.is_mandatory ? 'text-teal-400' : 'text-slate-500'}`}>
                            {d.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>))}
                    </div>
                  </div>

                  {/* Summary Card 4: Access Zones */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Granted Facility Zones ({(formData.access_levels || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(formData.access_levels || []).map((a, i) => (<span key={i} className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {a.location_name}
                        </span>))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-400"/>
                    <div>
                      <div className="text-xs font-bold text-white">Ready to activate this visitor category?</div>
                      <div className="text-[11px] text-slate-400">All configurations are validated and will immediately be active across registration kiosks and appointments.</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleSave()} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all shrink-0">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                    <span>{saving ? 'Publishing...' : editingCategory ? 'Save & Update Category' : 'Publish & Activate Category'}</span>
                  </button>
                </div>
              </div>)}

            {/* Builder Footer Navigation Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCancelBuilder} className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all cursor-pointer">
                Cancel & Exit Builder
              </motion.button>

              <div className="flex items-center gap-3">
                {currentStep > 1 && (<motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={handlePrevStep} className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer">
                    <ArrowLeft className="w-4 h-4 text-blue-400"/> Previous Step
                  </motion.button>)}

                {currentStep < 6 ? (<motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={handleNextStep} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white text-xs font-black tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer group">
                    <span>Next: {BUILDER_STEPS[currentStep].title}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"/>
                  </motion.button>) : (<motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => handleSave()} disabled={saving} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer group disabled:opacity-50">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"/>}
                    <span>{saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}</span>
                  </motion.button>)}
              </div>
            </div>
          </div>
        </div>) : (<div className="space-y-6">
          {/* Top Hero Banner for Categories List View (Admin Dashboard Style) */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0b1220] border border-slate-800 p-7 md:p-9 shadow-2xl transition-colors">
            {/* TOP CURVED WAVE SVG ACCENT (Matching Admin Dashboard) */}
            <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-80">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveCat)"/>
                <defs>
                  <linearGradient id="topWaveCat" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0f3875"/>
                    <stop offset="50%" stopColor="#1e50a2"/>
                    <stop offset="100%" stopColor="#00a0e9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* BOTTOM CURVED WAVE SVG ACCENT (Matching Admin Dashboard) */}
            <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
                <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveCat)"/>
                <defs>
                  <linearGradient id="bottomWaveCat" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00a0e9"/>
                    <stop offset="50%" stopColor="#2563eb"/>
                    <stop offset="100%" stopColor="#1d4ed8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 my-2">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Visitor Governance • Classification Console
                </div>

                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  Visitor Categories & Access Classes
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse"/>
                </h1>
                <p className="text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
                  Configure visitor classifications, duration thresholds, multi-step verification policies, required documentation, and security clearance zones.
                </p>
              </div>

              {/* Action Buttons with Admin Dashboard hover, scale & micro-animations */}
              <div className="flex flex-wrap items-center gap-3">
                <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => handleOpenAdd()} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer group">
                  <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90"/>
                  <span>Add New Category</span>
                </motion.button>

                <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={handleExportCSV} className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-md cursor-pointer group" title="Export categories to CSV">
                  <Download className="w-4 h-4 text-blue-400 transition-transform duration-300 group-hover:translate-y-0.5"/>
                  <span>Export</span>
                </motion.button>

                <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => fetchCategories()} disabled={loading} className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-2xl transition-all shadow-md cursor-pointer group disabled:opacity-50" title="Refresh Data">
                  <RefreshCw className={`h-4 w-4 text-blue-400 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}/>
                </motion.button>

                <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrint} className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-2xl transition-all shadow-md cursor-pointer group hidden sm:flex" title="Print view">
                  <Printer className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors"/>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Top 5 KPI Summary Cards Row (Admin Dashboard Style with Framer Motion & Glow) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <CategoryKpiCard icon={<LayoutGrid className="h-5 w-5"/>} label="Total Categories" value={stats.totalCategories} desc="Active visitor categories" theme="blue"/>
            <CategoryKpiCard icon={<CheckCircle2 className="h-5 w-5"/>} label="Active Categories" value={stats.activeCategories} desc={`${Math.round((stats.activeCategories / (stats.totalCategories || 1)) * 100)}% of total`} theme="emerald"/>
            <CategoryKpiCard icon={<Clock className="h-5 w-5"/>} label="Approval Required" value={stats.approvalRequired} desc="Approval workflows" theme="amber"/>
            <CategoryKpiCard icon={<Users className="h-5 w-5"/>} label="Walk-in Allowed" value={stats.walkinAllowed} desc="Allow walk-in visitors" theme="purple"/>
            <CategoryKpiCard icon={<FileCheck className="h-5 w-5"/>} label="Required Docs" value={stats.totalRequiredDocs} desc="Documentation rules" theme="cyan"/>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none" placeholder="Search categories by name, code, or description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}/>
              </div>
              <div className="md:col-span-3">
                <select className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white outline-none" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                  <option value="">Status: All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <select className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-white outline-none" value={filterAccess} onChange={(e) => { setFilterAccess(e.target.value); setPage(1); }}>
                  <option value="">Access Level: All</option>
                  <option value="Level 1 (General)">Level 1 (General)</option>
                  <option value="Level 2 (Restricted)">Level 2 (Restricted)</option>
                  <option value="Level 3 (Limited)">Level 3 (Limited)</option>
                  <option value="Level 4 (High Security)">Level 4 (High Security)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={() => setShowFilters(!showFilters)} className={`w-full px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${showFilters ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'}`}>
                  <SlidersHorizontal className="h-3.5 w-3.5"/>
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Filters */}
            {showFilters && (<div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approval Rule</label>
                  <select className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none" value={filterApproval} onChange={(e) => { setFilterApproval(e.target.value); setPage(1); }}>
                    <option value="">All Approvals</option>
                    <option value="true">Approval Required</option>
                    <option value="false">No Approval Needed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort Field</label>
                  <select className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                    <option value="display_order">Display Order</option>
                    <option value="category_name">Category Name</option>
                    <option value="category_code">Category Code</option>
                    <option value="created_at">Creation Date</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Order Direction</label>
                  <select className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}>
                    <option value="ASC">Ascending (A-Z, 0-9)</option>
                    <option value="DESC">Descending (Z-A, 9-0)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={clearFilters} className="w-full px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5"/> Clear Filters
                  </button>
                </div>
              </div>)}
          </div>

          {/* Categories Table Card */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {loading ? (<div className="p-16 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-400 mb-3"/>
                <p className="text-slate-400 text-xs font-semibold">Loading visitor categories...</p>
              </div>) : categories.length === 0 ? (<div className="p-16 text-center text-slate-400">
                <LayoutGrid className="h-12 w-12 text-slate-600 mx-auto mb-3"/>
                <h4 className="font-bold text-white text-base">No Visitor Categories Found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                  Categories define visitor security protocols, allowed visit lengths, and entry documentation.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={() => handleOpenAdd()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30">
                    <Plus className="w-4 h-4"/> Create First Category
                  </button>
                  <button type="button" onClick={() => handleOpenAdd(CATEGORY_PRESETS[0].preset)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800">
                    ⚡ Use Business Visitor Preset
                  </button>
                </div>
              </div>) : (<>
                <CategoryTable categories={categories} selectedCategoryId={selectedCategory?.id} sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => {
                    if (sortBy === field) {
                        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                    }
                    else {
                        setSortBy(field);
                        setSortOrder('ASC');
                    }
                }} onSelectRow={(cat) => handleViewStandaloneDetails(cat)} onView={(cat) => handleViewStandaloneDetails(cat)} onEdit={(cat) => handleOpenEdit(cat)} onStatus={(cat) => setArchiveTarget(cat)} onDelete={(cat) => setDeleteTarget(cat)}/>

                {/* Pagination Controls */}
                <div className="flex flex-wrap justify-between items-center p-4 border-t border-slate-800 text-xs gap-3">
                  <div className="font-semibold text-slate-400">
                    Showing {totalCount > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} categories
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-semibold text-[11px]">Per Page:</span>
                      <select className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white outline-none" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 flex items-center gap-1">
                        <ChevronLeft className="w-3.5 h-3.5"/> Prev
                      </button>
                      <span className="px-3 py-1 bg-slate-950 font-mono text-indigo-400 font-bold rounded-lg border border-slate-800">
                        {page} / {totalPages || 1}
                      </span>
                      <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 flex items-center gap-1">
                        Next <ChevronRight className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>
              </>)}
          </div>
        </div>)}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog show={!!archiveTarget} title={archiveTarget?.status === 'Archived' || archiveTarget?.is_archived ? 'Restore Category' : 'Archive Category'} message={archiveTarget?.status === 'Archived' || archiveTarget?.is_archived
            ? `Are you sure you want to restore "${archiveTarget?.category_name}"? This will make it active for new visitor registrations.`
            : `Are you sure you want to archive "${archiveTarget?.category_name}"? Archived categories cannot be selected by visitors.`} confirmLabel={archiveTarget?.status === 'Archived' || archiveTarget?.is_archived ? 'Restore' : 'Archive'} danger={!(archiveTarget?.status === 'Archived' || archiveTarget?.is_archived)} loading={archiving} onConfirm={handleArchiveConfirm} onCancel={() => setArchiveTarget(null)}/>

      <ConfirmationDialog show={!!deleteTarget} title="Delete Category" message={`Are you sure you want to soft-delete "${deleteTarget?.category_name}"? This category will be removed from future selection.`} confirmLabel="Delete" danger={true} loading={deleting} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}/>
    </div>);
}
