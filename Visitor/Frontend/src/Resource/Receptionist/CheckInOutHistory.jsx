import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LogIn,
  LogOut,
  Users,
  Eye,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Timer,
  Tag,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { checkinApi, checkoutApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resolvePhotoUrl, getPhotoFallbackInitials } from '../../utils/photoUtils';
import BackButton from '../../components/common/BackButton';

// Formatting helpers
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const formatDuration = (mins) => {
  if (mins === undefined || mins === null || mins === '') return '—';
  const num = parseInt(mins, 10);
  if (isNaN(num) || num < 0) return '—';
  if (num < 60) return `${num}m`;
  const h = Math.floor(num / 60);
  const m = num % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const THEME_STYLES = {
  blue: {
    barColor: '#3b82f6',
    hoverBarColor: '#60a5fa',
    darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
  },
  emerald: {
    barColor: '#10b981',
    hoverBarColor: '#34d399',
    darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
  },
  amber: {
    barColor: '#f59e0b',
    hoverBarColor: '#fbbf24',
    darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
  },
  cyan: {
    barColor: '#06b6d4',
    hoverBarColor: '#22d3ee',
    darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
  },
  purple: {
    barColor: '#a855f7',
    hoverBarColor: '#c084fc',
    darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
  },
  indigo: {
    barColor: '#6366f1',
    hoverBarColor: '#818cf8',
    darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
  }
};

function HistoryKpiCard({ title, value, subtitle, badge, icon, theme, onClick }) {
  const [hovered, setHovered] = useState(false);
  const styles = THEME_STYLES[theme] || THEME_STYLES.blue;
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`border rounded-2xl p-4.5 sm:p-5 pl-5 sm:pl-6 min-h-[155px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer bg-[#0a0f1d] border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] text-white ${
        hovered ? 'shadow-xl border-slate-700' : ''
      }`}
    >
      {/* Dark Hover Fill Overlay */}
      <div
        style={{
          background: styles.darkHoverBg,
          opacity: hovered ? 1 : 0,
        }}
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
      />

      {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
      <div
        style={{
          backgroundColor: hovered ? styles.hoverBarColor : styles.barColor,
          boxShadow: hovered ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }}
        className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl transition-all duration-300 group-hover:w-[9px] z-10"
      />

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-snug break-words pr-1">
          {title}
        </span>

        {/* Sleek Vertical Oval Pill Icon Capsule Container */}
        <div className="w-8 h-9 sm:w-9 sm:h-10 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className="flex items-baseline space-x-2 flex-wrap gap-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">{value}</h2>
          {badge}
        </div>
        <p className="text-[11px] text-slate-400 group-hover:text-slate-200 font-semibold mt-1 transition-colors leading-tight line-clamp-1">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

export default function CheckInOutHistory({ initialTab = 'all' }) {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab: 'all' | 'checkin' | 'checkout' | 'active'
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(paramTab || initialTab || 'all');

  // Main list state
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Stats / Dashboard KPI state
  const [stats, setStats] = useState({
    totalCheckins: 0,
    totalToday: 0,
    totalCheckouts: 0,
    checkedOutToday: 0,
    currentlyInside: 0,
    walkInsToday: 0,
    avgVisitDuration: 0,
    totalRecords: 0
  });

  // Filters state
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all'); // 'all', 'today', 'yesterday', '7days', 'month', 'custom'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'completed'
  const [typeFilter, setTypeFilter] = useState(''); // '', 'false' (pre-reg), 'true' (walk-in)
  const [methodFilter, setMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Inspector modal & quick checkout modal
  const [inspectedRecord, setInspectedRecord] = useState(null);
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [checkoutRemarks, setCheckoutRemarks] = useState('');
  const [checkoutMethod, setCheckoutMethod] = useState('MANUAL');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Show Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync tab with URL
  useEffect(() => {
    if (paramTab && ['all', 'checkin', 'checkout', 'active'].includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Quick date presets handler
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const toDateStr = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = toDateStr(today);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toDateStr(y);
      setDateFrom(yStr);
      setDateTo(yStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setDateFrom(toDateStr(past));
      setDateTo(toDateStr(today));
    } else if (preset === 'month') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setDateFrom(toDateStr(past));
      setDateTo(toDateStr(today));
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Fetch KPI statistics
  const fetchStats = useCallback(async () => {
    try {
      const [checkinDash, checkoutDash] = await Promise.allSettled([
        checkinApi.dashboard(),
        checkoutApi.dashboard()
      ]);

      let cData = {};
      let coData = {};
      if (checkinDash.status === 'fulfilled' && checkinDash.value?.data) {
        cData = checkinDash.value.data.data || checkinDash.value.data || {};
      }
      if (checkoutDash.status === 'fulfilled' && checkoutDash.value?.data) {
        coData = checkoutDash.value.data.data || checkoutDash.value.data || {};
      }

      setStats({
        totalCheckins: Number(cData.totalCheckins || coData.totalCheckins || 0),
        totalToday: Number(cData.totalToday || 0),
        totalCheckouts: Number(cData.totalCheckouts || coData.totalExits || 0),
        checkedOutToday: Number(cData.checkedOutToday || coData.totalExitsToday || 0),
        currentlyInside: Number(cData.currentlyInside || coData.totalInside || 0),
        walkInsToday: Number(cData.walkInsToday || 0),
        avgVisitDuration: Math.round(Number(cData.avgVisitDuration || coData.avgDuration || 0)),
        totalRecords: Number(cData.totalCheckins || 0)
      });
    } catch (err) {
      console.warn('Failed to load check-in/out dashboard stats:', err);
    }
  }, []);

  // Helper to ensure only real, non-empty visitor records are counted
  const isRealVisitor = (r) => {
    if (!r) return false;
    const name = r.visitorName || r.visitor_name;
    return !!(name && String(name).trim() !== '' && String(name).trim().toLowerCase() !== 'visitor');
  };

  // Strictly real visitor records
  const validRecords = useMemo(() => {
    return records.filter(isRealVisitor);
  }, [records]);

  // Real dynamic counts computed strictly from real records
  const totalCheckinsCount = useMemo(() => {
    if (typeof stats.totalCheckins === 'number' && stats.totalCheckins > 0) {
      return stats.totalCheckins;
    }
    return validRecords.length;
  }, [stats.totalCheckins, validRecords.length]);

  const totalCheckoutsCount = useMemo(() => {
    if (typeof stats.totalCheckouts === 'number' && stats.totalCheckouts > 0) {
      return stats.totalCheckouts;
    }
    const completedInList = validRecords.filter(
      (r) => r.checkedOutAt || r.formattedStatus === 'Completed' || r.eventType === 'CHECK_OUT'
    ).length;
    return completedInList;
  }, [stats.totalCheckouts, validRecords]);

  const activeInsideCount = useMemo(() => {
    if (typeof stats.currentlyInside === 'number') {
      return stats.currentlyInside;
    }
    const insideInList = validRecords.filter(
      (r) => !r.checkedOutAt && (r.formattedStatus === 'Inside' || r.eventType === 'ACTIVE_INSIDE')
    ).length;
    return insideInList;
  }, [stats.currentlyInside, validRecords]);

  const avgDurationMinutes = useMemo(() => {
    if (typeof stats.avgVisitDuration === 'number' && stats.avgVisitDuration > 0) {
      return stats.avgVisitDuration;
    }
    const durations = validRecords
      .map((r) => Number(r.durationMinutes || r.totalVisitDuration))
      .filter((d) => !isNaN(d) && d > 0);
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }, [stats.avgVisitDuration, validRecords]);

  // Primary Data Fetcher
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (search.trim()) params.search = search.trim();
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      let fetchedList = [];
      let totalCount = 0;
      let totalPages = 1;

      if (activeTab === 'checkin') {
        if (statusFilter) params.status = statusFilter;
        if (typeFilter !== '') params.isWalkIn = typeFilter;

        const res = await checkinApi.history(params);
        fetchedList = (res.data?.data || []).map((item) => ({
          ...item,
          eventType: 'CHECK_IN',
          timestamp: item.checkedInAt,
          formattedStatus: item.checkedOutAt ? 'Completed' : 'Inside'
        }));
        totalCount = res.data?.pagination?.total ?? fetchedList.length;
        totalPages = res.data?.pagination?.pages ?? Math.ceil(totalCount / pagination.limit) ?? 1;
      } else if (activeTab === 'checkout') {
        if (methodFilter) params.checkoutMethod = methodFilter;

        const res = await checkoutApi.history(params);
        fetchedList = (res.data?.data || []).map((item) => ({
          ...item,
          eventType: 'CHECK_OUT',
          timestamp: item.checkoutTime || item.checkedOutAt,
          durationMinutes: item.totalVisitDuration || item.durationMinutes,
          formattedStatus: 'Completed'
        }));
        totalCount = res.data?.pagination?.total ?? fetchedList.length;
        totalPages = res.data?.pagination?.pages ?? Math.ceil(totalCount / pagination.limit) ?? 1;
      } else if (activeTab === 'active') {
        // Only active visitors inside
        const res = await checkinApi.history({
          ...params,
          status: 'active'
        });
        fetchedList = (res.data?.data || []).map((item) => ({
          ...item,
          eventType: 'ACTIVE_INSIDE',
          timestamp: item.checkedInAt,
          formattedStatus: 'Inside'
        }));
        totalCount = res.data?.pagination?.total ?? fetchedList.length;
        totalPages = res.data?.pagination?.pages ?? Math.ceil(totalCount / pagination.limit) ?? 1;
      } else {
        // 'all' - Unified timeline of Check-In and Check-Out events
        const [checkinRes, checkoutRes] = await Promise.allSettled([
          checkinApi.history({ ...params, limit: Math.max(pagination.limit, 25) }),
          checkoutApi.history({ ...params, limit: Math.max(pagination.limit, 25) })
        ]);

        const inItems = checkinRes.status === 'fulfilled' ? checkinRes.value?.data?.data || [] : [];
        const outItems = checkoutRes.status === 'fulfilled' ? checkoutRes.value?.data?.data || [] : [];

        // Normalize Check-Ins
        const mappedIns = inItems.map((r) => ({
          ...r,
          eventType: r.checkedOutAt ? 'COMPLETED_VISIT' : 'ACTIVE_INSIDE',
          timestamp: r.checkedInAt,
          formattedStatus: r.checkedOutAt ? 'Completed' : 'Inside'
        }));

        // Normalize any exits that might not be in checkin list
        const existingCheckinIds = new Set(inItems.map((c) => c.id));
        const mappedOuts = outItems
          .filter((o) => !o.checkinId || !existingCheckinIds.has(o.checkinId))
          .map((o) => ({
            ...o,
            eventType: 'CHECK_OUT',
            timestamp: o.checkoutTime || o.checkedOutAt,
            durationMinutes: o.totalVisitDuration || o.durationMinutes,
            formattedStatus: 'Completed'
          }));

        const unified = [...mappedIns, ...mappedOuts];

        // Apply client filters if needed
        let filtered = unified;
        if (statusFilter === 'active') {
          filtered = filtered.filter((r) => !r.checkedOutAt && r.formattedStatus === 'Inside');
        } else if (statusFilter === 'completed') {
          filtered = filtered.filter((r) => r.checkedOutAt || r.formattedStatus === 'Completed');
        }
        if (typeFilter !== '') {
          const isW = typeFilter === 'true';
          filtered = filtered.filter((r) => !!r.isWalkIn === isW);
        }

        // Sort descending by primary timestamp
        filtered.sort((a, b) => {
          const tA = new Date(a.timestamp || a.checkedInAt || 0).getTime();
          const tB = new Date(b.timestamp || b.checkedInAt || 0).getTime();
          return sortOrder === 'asc' ? tA - tB : tB - tA;
        });

        totalCount = Math.max(
          filtered.length,
          (checkinRes.value?.data?.pagination?.total || 0) + (checkoutRes.value?.data?.pagination?.total || 0)
        );
        totalPages = Math.max(1, Math.ceil(totalCount / pagination.limit));
        fetchedList = filtered.slice(0, pagination.limit);
      }

      const validFetched = fetchedList.filter(isRealVisitor);
      setRecords(validFetched);
      setPagination((prev) => ({
        ...prev,
        total: validFetched.length,
        pages: Math.max(1, Math.ceil(validFetched.length / pagination.limit))
      }));
    } catch (err) {
      console.error('Error loading check-in / check-out history:', err);
      setError(getErrorMessage(err) || 'Failed to load records from server.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    pagination.page,
    pagination.limit,
    search,
    dateFrom,
    dateTo,
    statusFilter,
    typeFilter,
    methodFilter,
    sortOrder
  ]);

  // Initial and reactive effects
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadRecords();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setTypeFilter('');
    setMethodFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    showToast('Filters reset.');
  };

  // Quick Check-Out action
  const handleConfirmQuickCheckout = async () => {
    if (!checkoutTarget) return;
    setIsProcessingCheckout(true);
    try {
      const code =
        checkoutTarget.badgeNumber ||
        checkoutTarget.referenceCode ||
        checkoutTarget.reference_code ||
        String(checkoutTarget.checkinId || checkoutTarget.id);

      await checkoutApi.process({
        code,
        checkoutMethod: checkoutMethod || 'MANUAL',
        remarks: checkoutRemarks || 'Quick check-out from History Console'
      });

      showToast(`Visitor ${checkoutTarget.visitorName || 'Visitor'} checked out successfully.`);
      setCheckoutTarget(null);
      setCheckoutRemarks('');
      fetchStats();
      loadRecords();
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to check out visitor.', 'error');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Delete record handler - automatic instant deletion without prompt
  const handleDeleteRecord = async (record) => {
    const targetName = record.visitorName || record.visitor_name || 'Visitor';
    const targetKey = record.checkoutId || record.id;
    const checkinKey = record.checkinId || record.id;

    // 1. Instantly remove from records list (Optimistic UI update)
    setRecords((prev) =>
      prev.filter(
        (r) =>
          (r.checkoutId || r.id) !== targetKey &&
          (r.checkinId || r.id) !== checkinKey &&
          r.id !== record.id
      )
    );
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      pages: Math.max(1, Math.ceil(Math.max(0, prev.total - 1) / (prev.limit || 15)))
    }));

    // 2. Decrement local stats counts immediately
    setStats((prev) => ({
      ...prev,
      totalCheckins: Math.max(0, (prev.totalCheckins || 0) - 1),
      totalCheckouts:
        record.checkedOutAt || record.formattedStatus === 'Completed' || record.eventType === 'CHECK_OUT'
          ? Math.max(0, (prev.totalCheckouts || 0) - 1)
          : prev.totalCheckouts,
      currentlyInside:
        !record.checkedOutAt && (record.formattedStatus === 'Inside' || record.eventType === 'ACTIVE_INSIDE')
          ? Math.max(0, (prev.currentlyInside || 0) - 1)
          : prev.currentlyInside,
      checkedOutToday: record.checkedOutAt ? Math.max(0, (prev.checkedOutToday || 0) - 1) : prev.checkedOutToday,
      totalToday: Math.max(0, (prev.totalToday || 0) - 1)
    }));

    showToast(
      language === 'am'
        ? `የ"${targetName}" መዝገብ ወዲያውኑ ተሰርዟል`
        : `Visit record for "${targetName}" was deleted automatically.`,
      'success'
    );

    // 3. Execute delete API asynchronously in background
    try {
      if (record.eventType === 'CHECK_OUT' || record.checkoutId || record.checkoutTime) {
        await checkoutApi.delete(record.checkoutId || record.id);
      } else {
        await checkinApi.delete(record.checkinId || record.id);
      }
      fetchStats();
    } catch (err) {
      console.error('Delete record error:', err);
      loadRecords();
      fetchStats();
      showToast(getErrorMessage(err, 'Failed to delete visit record on server'), 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      showToast('No records available to export.', 'error');
      return;
    }

    const headers = [
      'Event ID',
      'Visitor Name',
      'Company',
      'Email',
      'Phone',
      'Event Type',
      'Checked In',
      'Checked Out',
      'Duration',
      'Host Employee',
      'Department',
      'Badge Number',
      'Reference Code',
      'Purpose',
      'Status'
    ];

    const rows = records.map((r) => [
      r.id || '',
      `"${r.visitorName || ''}"`,
      `"${r.visitorCompany || ''}"`,
      `"${r.visitorEmail || ''}"`,
      `"${r.visitorPhone || ''}"`,
      `"${r.isWalkIn ? 'Walk-In' : 'Pre-Registered'}"`,
      `"${formatDateTime(r.checkedInAt)}"`,
      `"${r.checkedOutAt || r.checkoutTime ? formatDateTime(r.checkedOutAt || r.checkoutTime) : 'Inside'}"`,
      `"${formatDuration(r.durationMinutes || r.totalVisitDuration)}"`,
      `"${r.hostName || ''}"`,
      `"${r.department || ''}"`,
      `"${r.badgeNumber || ''}"`,
      `"${r.referenceCode || ''}"`,
      `"${r.purpose || ''}"`,
      `"${r.checkedOutAt || r.checkoutTime ? 'Completed' : 'Inside'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `checkin_checkout_history_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported history to CSV successfully.');
  };

  // Print view handler
  const handlePrint = () => {
    window.print();
  };

  // Copy code to clipboard helper
  const handleCopyCode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (datePreset !== 'all') count++;
    if (dateFrom || dateTo) count++;
    if (statusFilter) count++;
    if (typeFilter !== '') count++;
    if (methodFilter) count++;
    return count;
  }, [search, datePreset, dateFrom, dateTo, statusFilter, typeFilter, methodFilter]);

  return (
    <div className="min-h-screen bg-slate-900/40 text-slate-100 p-3 sm:p-5 lg:p-7 space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 transition text-slate-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <BackButton />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/dashboard?view=checkin')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95"
            title="Open Check-In Console"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Check-In Now</span>
          </button>
          <button
            onClick={() => navigate('/dashboard?view=checkout')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95"
            title="Open Check-Out Console"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Check-Out Now</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-bold rounded-xl transition"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-bold rounded-xl transition"
            title="Print Report"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={() => {
              fetchStats();
              loadRecords();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition transform active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS (RECEPTION DASHBOARD STYLE & REAL COUNTS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
        {/* Total Check-Ins */}
        <HistoryKpiCard
          title={language === 'am' ? 'አጠቃላይ መግቢያዎች' : 'Total Check-Ins'}
          value={totalCheckinsCount.toLocaleString()}
          subtitle={language === 'am' ? 'በአጠቃላይ የተመዘገቡ መግቢያዎች' : 'All-time verified entries'}
          badge={
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {stats.totalToday > 0 ? `+${stats.totalToday} Today` : (language === 'am' ? 'ትክክለኛ ቁጥር' : 'Real Count')}
            </span>
          }
          icon={<LogIn className="w-5 h-5 text-emerald-400" />}
          theme="emerald"
          onClick={() => handleTabChange('checkin')}
        />

        {/* Completed Check-Outs */}
        <HistoryKpiCard
          title={language === 'am' ? 'የተጠናቀቁ መውጫዎች' : 'Completed Check-Outs'}
          value={totalCheckoutsCount.toLocaleString()}
          subtitle={language === 'am' ? 'የተረጋገጡ የጎብኚዎች መውጫዎች' : 'Official departures logged'}
          badge={
            <span className="text-[10px] text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {stats.checkedOutToday > 0 ? `+${stats.checkedOutToday} Today` : (language === 'am' ? 'የወጡ' : 'Exit Logged')}
            </span>
          }
          icon={<LogOut className="w-5 h-5 text-amber-400" />}
          theme="amber"
          onClick={() => handleTabChange('checkout')}
        />

        {/* Currently Inside */}
        <HistoryKpiCard
          title={language === 'am' ? 'አሁን በተቋሙ ያሉ' : 'Currently Inside'}
          value={activeInsideCount.toLocaleString()}
          subtitle={language === 'am' ? 'በተቋሙ ውስጥ ያሉ ንቁ ጎብኚዎች' : 'Active visitors on site'}
          badge={
            <span className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              {language === 'am' ? 'አሁን ያሉ' : 'Active Now'}
            </span>
          }
          icon={<Users className="w-5 h-5 text-cyan-400" />}
          theme="cyan"
          onClick={() => handleTabChange('active')}
        />

        {/* Average Visit Duration */}
        <HistoryKpiCard
          title={language === 'am' ? 'አማካኝ የቆይታ ጊዜ' : 'Avg Stay Duration'}
          value={formatDuration(avgDurationMinutes)}
          subtitle={language === 'am' ? 'የአጠቃላይ ጉብኝት አማካኝ ቆይታ' : 'Check-in to check-out average'}
          badge={
            <span className="text-[10px] text-blue-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {language === 'am' ? 'አማካኝ ቆይታ' : 'Average Stay'}
            </span>
          }
          icon={<Timer className="w-5 h-5 text-blue-400" />}
          theme="blue"
          onClick={() => handleTabChange('all')}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 overflow-x-auto no-scrollbar no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>All Movement Logs</span>
          </button>

          <button
            onClick={() => handleTabChange('checkin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'checkin'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LogIn className="h-4 w-4 text-emerald-400" />
            <span>Check-In History</span>
          </button>

          <button
            onClick={() => handleTabChange('checkout')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'checkout'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>Check-Out History</span>
          </button>

          <button
            onClick={() => handleTabChange('active')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Currently Inside</span>
            {stats.currentlyInside > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-extrabold border border-emerald-500/30">
                {stats.currentlyInside}
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Total Records:</span>
          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700/60">
            {pagination.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3 no-print">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitor name, badge #, reference code, host, company, department..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePresetChange(p.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  datePreset === p.id
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Submit button */}
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        </form>

        {/* Collapsible Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-800 pt-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Date From */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Visit Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Status: All</option>
                    <option value="active">Active (Currently Inside)</option>
                    <option value="completed">Completed (Checked Out)</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Visitor Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Type: All</option>
                    <option value="false">Pre-Registered</option>
                    <option value="true">Walk-In Visitor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300 text-xs shadow-lg">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={loadRecords}
            className="px-3 py-1 bg-rose-600/40 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Records Table / Cards */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-200">Loading visit movement records...</p>
            <p className="text-xs text-slate-500 mt-1">Querying check-in and check-out logs</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Clock className="h-7 w-7 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No movement history records found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              There are no matching check-in or check-out events for the selected filters.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on small mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3.5">Visitor</th>
                    <th className="px-3 py-3.5">Type &amp; Status</th>
                    <th className="px-3 py-3.5">Check-In</th>
                    <th className="px-3 py-3.5">Check-Out</th>
                    <th className="px-3 py-3.5">Duration</th>
                    <th className="px-4 py-3.5">Host &amp; Dept</th>
                    <th className="px-3 py-3.5">Badge / Ref</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {records.map((r) => {
                    const isInside = !r.checkedOutAt && r.formattedStatus === 'Inside';
                    const photo = resolvePhotoUrl(r.photoUrl || r.visitor_photo);
                    const initials = getPhotoFallbackInitials(r.visitorName || 'Visitor');
                    const refCode = r.referenceCode || r.reference_code || r.historyCode || '';

                    return (
                      <tr
                        key={r.id || `${r.visitorId}-${r.timestamp}`}
                        className="hover:bg-slate-800/40 transition group cursor-pointer"
                        onClick={() => setInspectedRecord(r)}
                      >
                        {/* Visitor Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={r.visitorName}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              {!photo && (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow">
                                  {initials}
                                </div>
                              )}
                              {isInside && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"
                                  title="Currently Inside"
                                ></span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate group-hover:text-indigo-300 transition">
                                {r.visitorName || 'Visitor'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {r.visitorCompany || r.visitorEmail || 'General Visitor'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type & Status */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.isWalkIn
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              }`}
                            >
                              {r.isWalkIn ? 'Walk-In' : 'Pre-Reg'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isInside
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {isInside ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Inside
                                </>
                              ) : (
                                'Checked-Out'
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Check-In Time */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-slate-200">
                            {formatTimeOnly(r.checkedInAt || r.timestamp)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatDateOnly(r.checkedInAt || r.timestamp)}
                          </p>
                        </td>

                        {/* Check-Out Time */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {isInside ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              Active Inside
                            </span>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-200">
                                {formatTimeOnly(r.checkedOutAt || r.checkoutTime)}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {formatDateOnly(r.checkedOutAt || r.checkoutTime)}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-1 rounded-lg">
                            <Clock className="h-3 w-3 text-indigo-400" />
                            {formatDuration(r.durationMinutes || r.totalVisitDuration)}
                          </span>
                        </td>

                        {/* Host & Department */}
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <p className="font-semibold text-slate-200 truncate flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            {r.hostName || 'Front Desk'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                            {r.department || 'General'}
                          </p>
                        </td>

                        {/* Badge / Reference */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {r.badgeNumber ? (
                            <p className="font-mono font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700/80 inline-block mb-1">
                              {r.badgeNumber}
                            </p>
                          ) : null}
                          {refCode ? (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                              <span className="truncate max-w-[90px]">{refCode}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(refCode);
                                }}
                                className="hover:text-indigo-300"
                                title="Copy Reference"
                              >
                                {copiedCode === refCode ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3.5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectedRecord(r)}
                              className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {isInside && (
                              <button
                                type="button"
                                onClick={() => setCheckoutTarget(r)}
                                className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                                title="Quick Check-Out"
                              >
                                <LogOut className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r)}
                              className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {records.map((r) => {
                const isInside = !r.checkedOutAt && r.formattedStatus === 'Inside';
                const photo = resolvePhotoUrl(r.photoUrl || r.visitor_photo);
                const initials = getPhotoFallbackInitials(r.visitorName || 'Visitor');

                return (
                  <div
                    key={r.id || `${r.visitorId}-${r.timestamp}`}
                    className="p-4 space-y-3 hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => setInspectedRecord(r)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {photo ? (
                            <img
                              src={photo}
                              alt={r.visitorName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          {!photo && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow">
                              {initials}
                            </div>
                          )}
                          {isInside && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{r.visitorName || 'Visitor'}</h4>
                          <p className="text-xs text-slate-400">{r.visitorCompany || 'General Visitor'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isInside
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isInside ? 'Inside' : 'Completed'}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400">
                          {formatDuration(r.durationMinutes || r.totalVisitDuration)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Check-In</span>
                        <span className="text-slate-200 font-semibold">{formatDateTime(r.checkedInAt || r.timestamp)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Check-Out</span>
                        <span className="text-slate-200 font-semibold">
                          {isInside ? <span className="text-emerald-400">Active Inside</span> : formatDateTime(r.checkedOutAt || r.checkoutTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Host</span>
                        <span className="text-slate-200 truncate block">{r.hostName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Badge #</span>
                        <span className="font-mono text-indigo-300">{r.badgeNumber || '—'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setInspectedRecord(r)}
                        className="px-3 py-1.5 bg-blue-500/15 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>
                      {isInside && (
                        <button
                          type="button"
                          onClick={() => setCheckoutTarget(r)}
                          className="px-3 py-1.5 bg-amber-500/15 text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Quick Check-Out</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r)}
                        className="px-3 py-1.5 bg-rose-500/15 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-800 bg-slate-950/40 text-xs no-print">
              <div className="text-slate-400 font-medium">
                Showing{' '}
                <span className="text-white font-bold">
                  {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="text-white font-bold">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="text-white font-bold">{pagination.total.toLocaleString()}</span> records
              </div>

              <div className="flex items-center gap-3">
                {/* Limit selector */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-[11px]">Per page:</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }));
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page buttons */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 py-1 font-bold text-white bg-indigo-600/30 border border-indigo-500/40 rounded-lg">
                    {pagination.page} / {Math.max(1, pagination.pages)}
                  </span>

                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* INSPECTOR MODAL: Full 360 Visit Details */}
      <AnimatePresence>
        {inspectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Visit Movement Audit</h3>
                    <p className="text-xs text-slate-400">
                      ID: #{inspectedRecord.id} · Ref: {inspectedRecord.referenceCode || inspectedRecord.reference_code || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedRecord(null)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Visitor Profile Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center gap-3.5">
                    {resolvePhotoUrl(inspectedRecord.photoUrl || inspectedRecord.visitor_photo) ? (
                      <img
                        src={resolvePhotoUrl(inspectedRecord.photoUrl || inspectedRecord.visitor_photo)}
                        alt={inspectedRecord.visitorName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/40 shadow-lg"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg">
                        {getPhotoFallbackInitials(inspectedRecord.visitorName || 'Visitor')}
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-black text-white">{inspectedRecord.visitorName || 'Visitor'}</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {inspectedRecord.visitorCompany || 'Independent Visitor'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-500" />
                          {inspectedRecord.visitorEmail || '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-500" />
                          {inspectedRecord.visitorPhone || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 self-stretch sm:self-auto justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        !inspectedRecord.checkedOutAt && inspectedRecord.formattedStatus === 'Inside'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {!inspectedRecord.checkedOutAt && inspectedRecord.formattedStatus === 'Inside' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Currently Inside
                        </>
                      ) : (
                        'Completed Exit'
                      )}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Duration: {formatDuration(inspectedRecord.durationMinutes || inspectedRecord.totalVisitDuration)}
                    </span>
                  </div>
                </div>

                {/* Visit Timeline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Entrance / Check-In */}
                  <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <LogIn className="h-4 w-4" />
                      <span>Entrance &amp; Check-In</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Check-In Time</p>
                      <p className="text-sm font-black text-white">
                        {formatDateTime(inspectedRecord.checkedInAt || inspectedRecord.timestamp)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-500/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Entry Type</span>
                        <span className="font-bold text-slate-200">
                          {inspectedRecord.isWalkIn ? 'Walk-In Registration' : 'Pre-Scheduled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Badge Assigned</span>
                        <span className="font-mono font-bold text-indigo-300">
                          {inspectedRecord.badgeNumber || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exit / Check-Out */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <LogOut className="h-4 w-4" />
                      <span>Departure &amp; Check-Out</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Check-Out Time</p>
                      <p className="text-sm font-black text-white">
                        {!inspectedRecord.checkedOutAt && inspectedRecord.formattedStatus === 'Inside' ? (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            Visitor on premises
                          </span>
                        ) : (
                          formatDateTime(inspectedRecord.checkedOutAt || inspectedRecord.checkoutTime)
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-500/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Exit Method</span>
                        <span className="font-bold text-slate-200">
                          {inspectedRecord.checkoutMethod || 'MANUAL'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Total Duration</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatDuration(inspectedRecord.durationMinutes || inspectedRecord.totalVisitDuration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Host & Department Information */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    <span>Host Employee &amp; Visit Details</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Host Employee</span>
                      <span className="font-bold text-white">{inspectedRecord.hostName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                      <span className="font-bold text-white">{inspectedRecord.department || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Reference Code</span>
                      <span className="font-mono text-indigo-300 font-bold">
                        {inspectedRecord.referenceCode || inspectedRecord.reference_code || '—'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Visit Purpose</span>
                    <span className="text-slate-200 font-medium">
                      {inspectedRecord.purpose || 'Official Business Meeting'}
                    </span>
                  </div>
                </div>

                {/* Operations & Notes */}
                {(inspectedRecord.notes || inspectedRecord.remarks || inspectedRecord.receptionistName) && (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Operations &amp; Remarks
                    </span>
                    {inspectedRecord.receptionistName && (
                      <p className="text-slate-300">
                        <strong className="text-slate-400">Operator:</strong> {inspectedRecord.receptionistName}
                      </p>
                    )}
                    {inspectedRecord.remarks && (
                      <p className="text-slate-300">
                        <strong className="text-slate-400">Exit Remarks:</strong> {inspectedRecord.remarks}
                      </p>
                    )}
                    {inspectedRecord.notes && (
                      <p className="text-slate-300">
                        <strong className="text-slate-400">Notes:</strong> {inspectedRecord.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>

                <div className="flex items-center gap-2">
                  {!inspectedRecord.checkedOutAt && inspectedRecord.formattedStatus === 'Inside' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = inspectedRecord;
                        setInspectedRecord(null);
                        setCheckoutTarget(target);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Check-Out Visitor</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setInspectedRecord(null)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK CHECK-OUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {checkoutTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Confirm Check-Out</h3>
                  <p className="text-xs text-slate-400">Process exit and update visit duration</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                <p className="text-white font-bold">{checkoutTarget.visitorName || 'Visitor'}</p>
                <p className="text-slate-400">
                  Badge: <strong className="text-indigo-300 font-mono">{checkoutTarget.badgeNumber || 'N/A'}</strong> ·
                  Ref: <strong className="text-slate-300 font-mono">{checkoutTarget.referenceCode || 'N/A'}</strong>
                </p>
                <p className="text-slate-400">
                  Checked in at: {formatDateTime(checkoutTarget.checkedInAt || checkoutTarget.timestamp)}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Check-Out Method
                  </label>
                  <select
                    value={checkoutMethod}
                    onChange={(e) => setCheckoutMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="MANUAL">Manual Front Desk Entry</option>
                    <option value="QR">QR Code Scanner</option>
                    <option value="KIOSK">Self-Service Exit Kiosk</option>
                    <option value="AUTO">Automated Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Exit Remarks / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={checkoutRemarks}
                    onChange={(e) => setCheckoutRemarks(e.target.value)}
                    placeholder="Badge returned, keycard handed over, visit concluded normally..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isProcessingCheckout}
                  onClick={() => setCheckoutTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingCheckout}
                  onClick={handleConfirmQuickCheckout}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {isProcessingCheckout ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Check-Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
