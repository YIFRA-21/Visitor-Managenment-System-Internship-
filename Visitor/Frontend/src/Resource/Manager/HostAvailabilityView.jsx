import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  RefreshCw, 
  Mail, 
  Search, 
  List, 
  LayoutGrid, 
  Filter, 
  ShieldCheck, 
  ShieldAlert,
  UserX, 
  Users,
  Eye,
  Sliders,
  CalendarOff,
  User,
  Calendar,
  X,
  Phone,
  Check
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import MetricCard, { dashboardContainerVariants } from './components/ExecutiveMetricCard';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function HostAvailabilityView() {
    const { t, tStatus } = useLanguage();
    const { isDark } = useTheme();
    const { toError } = useResponseNavigation();
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Modals state
    const [selectedScheduleHost, setSelectedScheduleHost] = useState(null);
    const [selectedEditHost, setSelectedEditHost] = useState(null);
    const [editFormData, setEditFormData] = useState({
      availabilityStatus: 'AVAILABLE',
      maxVisitorsPerDay: 10,
      officeLocation: '',
      officePhone: '',
    });
    const [editSaving, setEditSaving] = useState(false);

    const fetchHosts = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getHostAvailability();
            setHosts(Array.isArray(data) ? data : []);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to load host availability');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHosts();
    }, []);

    const handleUpdateStatus = async (employeeId, newStatus) => {
        setActionLoadingId(employeeId);
        setError('');
        try {
            await managerApi.updateHostStatus(employeeId, {
                availabilityStatus: newStatus
            });
            setHosts(prev => prev.map(h => (h.id === employeeId ? { ...h, availability_status: newStatus } : h)));
            const hostObj = hosts.find(h => h.id === employeeId);
            const hostName = hostObj?.full_name || 'Host';
            const readableStatus = newStatus.replace('_', ' ').toLowerCase();
            setSuccessMessage(`${hostName} duty status set to "${readableStatus}".`);
        }
        catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to update host availability');
        }
        finally {
            setActionLoadingId(null);
        }
    };

    const handleOpenEditModal = (host) => {
      setSelectedEditHost(host);
      setEditFormData({
        availabilityStatus: host.availability_status || 'AVAILABLE',
        maxVisitorsPerDay: host.max_visitors_per_day || 10,
        officeLocation: host.office_location || '',
        officePhone: host.office_phone || host.mobile_number || '',
      });
    };

    const handleSaveEdit = async (e) => {
      e.preventDefault();
      if (!selectedEditHost) return;
      setEditSaving(true);
      setError('');
      try {
        await managerApi.updateHostStatus(selectedEditHost.id, {
          availabilityStatus: editFormData.availabilityStatus,
          maxVisitorsPerDay: parseInt(editFormData.maxVisitorsPerDay, 10) || 10,
          officeLocation: editFormData.officeLocation,
          officePhone: editFormData.officePhone,
        });
        setHosts(prev => prev.map(h => h.id === selectedEditHost.id ? {
          ...h,
          availability_status: editFormData.availabilityStatus,
          max_visitors_per_day: parseInt(editFormData.maxVisitorsPerDay, 10) || 10,
          office_location: editFormData.officeLocation,
          office_phone: editFormData.officePhone,
        } : h));
        setSuccessMessage(`Capacity and location settings saved for ${selectedEditHost.full_name}.`);
        setSelectedEditHost(null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to update host settings');
      } finally {
        setEditSaving(false);
      }
    };

    const filteredHosts = hosts.filter(h => {
        const matchesSearch = (h.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (h.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (h.position || '').toLowerCase().includes(search.toLowerCase()) ||
            (h.office_location || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || h.availability_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const availableCount = hosts.filter(h => h.availability_status === 'AVAILABLE').length;
    const unavailableCount = hosts.filter(h => h.availability_status !== 'AVAILABLE').length;

    return (
    <div className={`p-6 space-y-6 font-sans transition-colors duration-200 min-h-screen ${
      isDark ? 'bg-[#080d16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Host Availability & Schedules
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Duty Matrix
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Live capacity monitoring, current visit engagements, and rapid availability overrides.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button 
              onClick={() => setViewMode('table')} 
              title="Table List View" 
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4"/>
              <span className="hidden sm:inline">Table List</span>
            </button>
            <button 
              onClick={() => setViewMode('cards')} 
              title="Grid Cards View" 
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4"/>
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button 
            onClick={fetchHosts} 
            disabled={loading} 
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <CountdownAlert
          alert={{ type: 'error', message: error }}
          onClose={() => setError('')}
          duration={8}
        />
      )}

      {successMessage && (
        <CountdownAlert
          alert={{ type: 'success', message: successMessage }}
          onClose={() => setSuccessMessage('')}
          duration={8}
        />
      )}

      {/* Overview Cards - Manager Dashboard Card Style with Real Data Animation */}
      <motion.div
        variants={dashboardContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <MetricCard
          title="Authorized Hosts"
          value={hosts.length}
          subtitle="Department staff pool"
          badge="Total Pool"
          theme="indigo"
          isActive={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
          icon={<Users className="w-4 h-4 text-indigo-400" />}
        />

        <MetricCard
          title="Available Right Now"
          value={availableCount}
          subtitle="Ready to receive visitors"
          badge="Active"
          theme="emerald"
          isActive={statusFilter === 'AVAILABLE'}
          onClick={() => setStatusFilter('AVAILABLE')}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="Unavailable / On Leave"
          value={unavailableCount}
          subtitle="Off-duty or occupied"
          badge="Away"
          theme="rose"
          isActive={statusFilter === 'UNAVAILABLE' || statusFilter === 'ON_LEAVE' || statusFilter === 'BUSY'}
          onClick={() => setStatusFilter('UNAVAILABLE')}
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
        />
      </motion.div>

      {/* Search and Filters Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-center justify-between transition-all duration-200 ${
        isDark ? 'bg-[#0c1322] border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search host by name, email, title, office..." 
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              isDark 
                ? 'bg-[#070b13] border-slate-800 text-slate-100 placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className={`text-xs flex items-center gap-1 mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Filter className="w-3.5 h-3.5"/> Status:
          </span>
          {[
            { id: 'ALL', label: 'All Hosts' },
            { id: 'AVAILABLE', label: 'Available' },
            { id: 'UNAVAILABLE', label: 'Unavailable' },
            { id: 'ON_LEAVE', label: 'On Leave' },
            { id: 'BUSY', label: 'Busy' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setStatusFilter(tab.id)} 
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : isDark 
                  ? 'bg-[#070b13] text-slate-400 hover:text-white border border-slate-800' 
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {loading ? (
        <div className={`py-24 text-center text-xs animate-pulse ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Retrieving live host availability schedules...
        </div>
      ) : filteredHosts.length === 0 ? (
        <div className={`py-16 text-center text-xs italic rounded-2xl border ${
          isDark ? 'bg-[#0c1322] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          No authorized hosts found matching your criteria.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE LIST VIEW */
        <div className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-200 ${
          isDark 
            ? 'bg-[#0c1322] border-slate-800/90 shadow-[0_10px_35px_rgba(0,0,0,0.5)]' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-semibold uppercase tracking-wider text-[10px] border-b transition-colors ${
                isDark 
                  ? 'bg-[#080e1b] text-slate-300 border-slate-800' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
              }`}>
                <tr>
                  <th className="py-3.5 px-4">{t('table.host', 'Host / Employee')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.dutyStatus', 'Duty Status')}</th>
                  <th className="py-3.5 px-4">{t('table.location', 'Location')}</th>
                  <th className="py-3.5 px-4">{t('table.workload', "Today's Workload")}</th>
                  <th className="py-3.5 px-4">{t('table.upcomingEngagement', 'Upcoming Engagement')}</th>
                  <th className="py-3.5 px-4 text-right">{t('table.action', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredHosts.map((host) => {
                  const isAvail = host.availability_status === 'AVAILABLE';
                  const isBusy = host.availability_status === 'BUSY';
                  const isLeave = host.availability_status === 'ON_LEAVE';
                  const isActing = actionLoadingId === host.id;
                  const workloadCount = host.today_workload || 0;
                  const maxWorkload = host.max_visitors_per_day || 10;
                  const workloadPct = Math.min(100, Math.round((workloadCount / maxWorkload) * 100));

                  return (
                    <tr 
                      key={host.id} 
                      className={`transition-colors duration-150 ${
                        isDark ? 'hover:bg-[#111a2e]/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Host info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAvail
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : isBusy
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          }`}>
                            {host.full_name?.[0] || 'H'}
                          </div>
                          <div>
                            <p className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {host.full_name}
                              {isAvail && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online & Available"/>
                              )}
                            </p>
                            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {host.position || 'Department Host'}
                            </p>
                            <span className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <Mail className="w-2.5 h-2.5"/> {host.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Duty Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAvail
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isBusy
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : isLeave
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {host.availability_status}
                        </span>
                      </td>

                      {/* Office Location */}
                      <td className="py-3.5 px-4">
                        <span className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <Building className="w-3.5 h-3.5 text-slate-400"/>
                          {host.office_location || 'Main HR Office'}
                        </span>
                      </td>

                      {/* Today's Workload */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                              {workloadCount} <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {maxWorkload} visits</span>
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{workloadPct}%</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'
                          }`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                workloadPct >= 90
                                  ? 'bg-rose-500'
                                  : workloadPct >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${workloadPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Upcoming Visit */}
                      <td className="py-3.5 px-4 text-xs">
                        {host.next_appointment_start ? (
                          <div className="space-y-0.5">
                            <span className="text-indigo-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-400"/>
                              {new Date(host.next_appointment_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {new Date(host.next_appointment_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        ) : (
                          <span className={`text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No visit booked</span>
                        )}
                      </td>

                      {/* Modern Actions Group */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Host Profile & Engagements */}
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleHost(host)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isDark 
                                ? 'bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border-slate-700 hover:border-indigo-500/50' 
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300'
                            }`}
                            title="View Host Profile & Engagement Schedule"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Configure Host Capacity & Office Limits */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(host)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isDark 
                                ? 'bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border-slate-700 hover:border-blue-500/50' 
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-300'
                            }`}
                            title="Configure Capacity Limit & Office Location"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Quick One-Click Availability Flip */}
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleUpdateStatus(host.id, isAvail ? 'UNAVAILABLE' : 'AVAILABLE')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isAvail
                                ? isDark 
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30 hover:border-emerald-400' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300'
                                : isDark
                                ? 'bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/40'
                                : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border-slate-200 hover:border-amber-300'
                            } ${isActing ? 'opacity-50 cursor-wait' : ''}`}
                            title={isAvail ? 'Click to mark Unavailable' : 'Click to mark Available'}
                          >
                            {isAvail ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          </button>

                          {/* 4. Quick Emergency Leave / Absence Toggle */}
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleUpdateStatus(host.id, isLeave ? 'AVAILABLE' : 'ON_LEAVE')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isLeave
                                ? isDark 
                                  ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40' 
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300'
                                : isDark
                                ? 'bg-slate-800/80 hover:bg-purple-600/30 text-slate-400 hover:text-purple-300 border-slate-700 hover:border-purple-500/40'
                                : 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border-slate-200 hover:border-purple-300'
                            } ${isActing ? 'opacity-50 cursor-wait' : ''}`}
                            title={isLeave ? 'Return host from Leave to Available' : 'Mark host as On Leave'}
                          >
                            <CalendarOff className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Direct Email Contact */}
                          {host.email && (
                            <a
                              href={`mailto:${host.email}?subject=Department%20Host%20Schedule%20Update`}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                                isDark 
                                  ? 'bg-slate-800/80 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border-slate-700 hover:border-sky-500/50' 
                                  : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border-slate-200 hover:border-sky-300'
                              }`}
                              title={`Send Email to ${host.full_name}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* 6. Availability Status Select Dropdown */}
                          <select 
                            value={host.availability_status} 
                            disabled={isActing} 
                            onChange={(e) => handleUpdateStatus(host.id, e.target.value)} 
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border focus:outline-none transition cursor-pointer ${
                              isAvail
                                ? isDark 
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : isBusy
                                ? isDark 
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' 
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                                : isLeave
                                ? isDark 
                                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/40' 
                                  : 'bg-purple-50 text-purple-700 border-purple-300'
                                : isDark 
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' 
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                            } ${isActing ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <option value="AVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Available</option>
                            <option value="UNAVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Unavailable</option>
                            <option value="ON_LEAVE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>On Leave</option>
                            <option value="BUSY" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Busy</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHosts.map((host) => {
            const isAvail = host.availability_status === 'AVAILABLE';
            const isBusy = host.availability_status === 'BUSY';
            const isLeave = host.availability_status === 'ON_LEAVE';
            const isActing = actionLoadingId === host.id;
            return (
              <div 
                key={host.id} 
                className={`p-5 rounded-2xl border shadow-xl transition space-y-4 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#0c1322] to-[#070b13] border-slate-800 hover:border-slate-700' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {host.full_name}
                      {isAvail && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{host.position || 'Department Staff'}</p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{host.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isAvail
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isBusy
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : isLeave
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {host.availability_status}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                  isDark ? 'bg-[#070b13]/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Today's Workload:</span>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {host.today_workload || 0} visits (Max {host.max_visitors_per_day || 10})
                    </span>
                  </div>

                  <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Office:</span>
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {host.office_location || 'Main HR Office'}
                    </span>
                  </div>

                  {host.next_appointment_start && (
                    <div className={`pt-2 border-t text-[11px] ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <span>Next Visit: </span>
                      <span className="text-indigo-400 font-medium">
                        {new Date(host.next_appointment_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Icons and Status Select */}
                <div className={`flex items-center justify-between pt-2 border-t text-xs ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedScheduleHost(host)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isDark ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-700' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
                      }`}
                      title="View Host Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(host)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isDark ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-700' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
                      }`}
                      title="Configure Capacity"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleUpdateStatus(host.id, isAvail ? 'UNAVAILABLE' : 'AVAILABLE')}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isAvail
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title={isAvail ? 'Mark Unavailable' : 'Mark Available'}
                    >
                      {isAvail ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    </button>
                    {host.email && (
                      <a
                        href={`mailto:${host.email}?subject=Host%20Schedule%20Update`}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isDark ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-700' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
                        }`}
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <select 
                    value={host.availability_status} 
                    disabled={isActing} 
                    onChange={(e) => handleUpdateStatus(host.id, e.target.value)} 
                    className={`px-2 py-1 rounded-lg text-xs font-semibold border focus:outline-none transition cursor-pointer ${
                      isDark ? 'bg-[#070b13] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="BUSY">Busy</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. VIEW HOST ENGAGEMENTS & SCHEDULE DETAILS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedScheduleHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`border rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0c1322] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-start justify-between pb-4 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-500 text-lg">
                  {selectedScheduleHost.full_name?.[0] || 'H'}
                </div>
                <div>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedScheduleHost.full_name}
                  </h3>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                    {selectedScheduleHost.position || 'Authorized Visitor Host'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedScheduleHost(null)}
                className={`p-1.5 transition rounded-xl cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Duty Status</span>
                <span className={`text-xs font-bold ${
                  selectedScheduleHost.availability_status === 'AVAILABLE' ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {selectedScheduleHost.availability_status}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Today's Visits</span>
                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
                  {selectedScheduleHost.today_workload || 0} Booked
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Max Limit</span>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedScheduleHost.max_visitors_per_day || 10} / day
                </span>
              </div>
            </div>

            {/* Details Panel */}
            <div className={`space-y-3 text-xs p-4 rounded-2xl border ${
              isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between py-1 border-b ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Host Email
                </span>
                <span className={`font-medium truncate max-w-[240px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedScheduleHost.email}
                </span>
              </div>

              <div className={`flex items-center justify-between py-1 border-b ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Office / Desk
                </span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedScheduleHost.office_location || 'Main HR Office'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Next Upcoming Visit
                </span>
                <span className="font-bold text-indigo-500 dark:text-indigo-400">
                  {selectedScheduleHost.next_appointment_start 
                    ? new Date(selectedScheduleHost.next_appointment_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'None Scheduled Today'
                  }
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const h = selectedScheduleHost;
                  setSelectedScheduleHost(null);
                  handleOpenEditModal(h);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Capacity</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScheduleHost(null)}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. CONFIGURE HOST CAPACITY & LOCATION SETTINGS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedEditHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`border rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0c1322] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Configure Host Settings</h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedEditHost.full_name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEditHost(null)} 
                className={`transition cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Duty Status */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Duty / Availability Status
                </label>
                <select
                  value={editFormData.availabilityStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, availabilityStatus: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                    isDark 
                      ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="AVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Available (Ready to receive visits)</option>
                  <option value="UNAVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Unavailable (Away / Off-duty)</option>
                  <option value="ON_LEAVE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>On Leave (Vacation / Sick)</option>
                  <option value="BUSY" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Busy (In session)</option>
                </select>
              </div>

              {/* Max Visitors Per Day */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Daily Visitor Workload Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editFormData.maxVisitorsPerDay}
                  onChange={(e) => setEditFormData({ ...editFormData, maxVisitorsPerDay: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isDark 
                      ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <span className={`text-[10px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maximum visitors allowed to book with this host in a single day.</span>
              </div>

              {/* Office Location */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Office / Desk Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Floor 3, Room 304"
                  value={editFormData.officeLocation}
                  onChange={(e) => setEditFormData({ ...editFormData, officeLocation: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isDark 
                      ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setSelectedEditHost(null)}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {editSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
}
