import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Clock, AlertTriangle, CheckCircle2, Building, RefreshCw, Mail, Search, List, LayoutGrid, Filter, ShieldCheck, UserX, Users } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';
import MetricCard, { dashboardContainerVariants } from './components/ExecutiveMetricCard';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function HostAvailabilityView() {
    const { t, tStatus } = useLanguage();
    const { toError } = useResponseNavigation();
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const fetchHosts = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getHostAvailability();
            setHosts(data);
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
        try {
            await managerApi.updateHostStatus(employeeId, {
                availabilityStatus: newStatus
            });
            setHosts(prev => prev.map(h => (h.id === employeeId ? { ...h, availability_status: newStatus } : h)));
        }
        catch (err) {
            toError(err, {
                title: 'Failed to Update Host Availability',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setActionLoadingId(null);
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
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Host Availability & Schedules
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Duty Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity monitoring, current visit engagements, and rapid availability overrides.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button onClick={() => setViewMode('table')} title="Table List View" className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${viewMode === 'table'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white'}`}>
              <List className="w-4 h-4"/>
              <span className="hidden sm:inline">Table List</span>
            </button>
            <button onClick={() => setViewMode('cards')} title="Grid Cards View" className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${viewMode === 'cards'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white'}`}>
              <LayoutGrid className="w-4 h-4"/>
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button onClick={fetchHosts} disabled={loading} className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

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
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search host by name, email, title, office..." className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5"/> Status:
          </span>
          {[
            { id: 'ALL', label: 'All Hosts' },
            { id: 'AVAILABLE', label: 'Available' },
            { id: 'UNAVAILABLE', label: 'Unavailable' },
            { id: 'ON_LEAVE', label: 'On Leave' },
            { id: 'BUSY', label: 'Busy' }
        ].map((tab) => (<button key={tab.id} onClick={() => setStatusFilter(tab.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>
              {tab.label}
            </button>))}
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {loading ? (<div className="py-24 text-center text-slate-400 text-xs animate-pulse">
          Retrieving live host availability schedules...
        </div>) : filteredHosts.length === 0 ? (<div className="py-16 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-2xl border border-slate-800">
          No authorized hosts found matching your criteria.
        </div>) : viewMode === 'table' ? (
        /* TABLE LIST VIEW */
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">{t('table.host', 'Host Name & Title')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.dutyStatus', 'Duty Status')}</th>
                  <th className="py-3.5 px-4">{t('table.location', 'Office Location')}</th>
                  <th className="py-3.5 px-4">{t('table.workload', "Today's Workload")}</th>
                  <th className="py-3.5 px-4">{t('table.upcomingEngagement', 'Upcoming Engagement')}</th>
                  <th className="py-3.5 px-4 text-right">{t('table.action', 'Duty Override')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHosts.map((host) => {
                const isAvail = host.availability_status === 'AVAILABLE';
                const isBusy = host.availability_status === 'BUSY';
                const isLeave = host.availability_status === 'ON_LEAVE';
                const isActing = actionLoadingId === host.id;
                const workloadCount = host.today_workload || 0;
                const maxWorkload = host.max_visitors_per_day || 10;
                const workloadPct = Math.min(100, Math.round((workloadCount / maxWorkload) * 100));
                return (<tr key={host.id} className="hover:bg-slate-850/40 transition">
                      {/* Host info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isAvail
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : isBusy
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                            {host.full_name?.[0] || 'H'}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              {host.full_name}
                              {isAvail && (<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online & Available"/>)}
                            </p>
                            <p className="text-[11px] text-slate-400">{host.position || 'Department Host'}</p>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-2.5 h-2.5"/> {host.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Duty Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAvail
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isBusy
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : isLeave
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                          {host.availability_status}
                        </span>
                      </td>

                      {/* Office Location */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500"/>
                          {host.office_location || 'Main HR Office'}
                        </span>
                      </td>

                      {/* Today's Workload */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              {workloadCount} <span className="text-slate-500 font-normal">/ {maxWorkload} visits</span>
                            </span>
                            <span className="text-[10px] text-slate-400">{workloadPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div className={`h-full rounded-full transition-all duration-300 ${workloadPct >= 90
                        ? 'bg-rose-500'
                        : workloadPct >= 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'}`} style={{ width: `${workloadPct}%` }}/>
                          </div>
                        </div>
                      </td>

                      {/* Upcoming Visit */}
                      <td className="py-3.5 px-4 text-xs">
                        {host.next_appointment_start ? (<div className="space-y-0.5">
                            <span className="text-indigo-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-400"/>
                              {new Date(host.next_appointment_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-[10px] text-slate-500">
                              {new Date(host.next_appointment_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>) : (<span className="text-slate-500 text-[11px] italic">No visit booked</span>)}
                      </td>

                      {/* Status Override Action Dropdown */}
                      <td className="py-3.5 px-4 text-right">
                        <select value={host.availability_status} disabled={isActing} onChange={(e) => handleUpdateStatus(host.id, e.target.value)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none transition cursor-pointer ${isAvail
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                        : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-slate-600'} ${isActing ? 'opacity-50 cursor-wait' : ''}`}>
                          <option value="AVAILABLE">Available</option>
                          <option value="UNAVAILABLE">Unavailable</option>
                          <option value="ON_LEAVE">On Leave</option>
                          <option value="BUSY">Busy</option>
                        </select>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>
        </div>) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHosts.map((host) => {
                const isAvail = host.availability_status === 'AVAILABLE';
                const isBusy = host.availability_status === 'BUSY';
                const isLeave = host.availability_status === 'ON_LEAVE';
                const isActing = actionLoadingId === host.id;
                return (<div key={host.id} className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-950/60 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-xl transition space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {host.full_name}
                      {isAvail && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>}
                    </h3>
                    <p className="text-xs text-slate-400">{host.position || 'Department Staff'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{host.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAvail
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isBusy
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : isLeave
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                    {host.availability_status}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Today's Workload:</span>
                    <span className="font-semibold text-slate-200">
                      {host.today_workload || 0} visits (Max {host.max_visitors_per_day || 10})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Office:</span>
                    <span className="text-slate-300">{host.office_location || 'HR Department'}</span>
                  </div>

                  {host.next_appointment_start && (<div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>Next Visit: </span>
                      <span className="text-indigo-400 font-medium">
                        {new Date(host.next_appointment_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>)}
                </div>

                {/* Quick Status Override Dropdown */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400">Override Status:</span>
                  <select value={host.availability_status} disabled={isActing} onChange={(e) => handleUpdateStatus(host.id, e.target.value)} className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="BUSY">Busy</option>
                  </select>
                </div>
              </div>);
            })}
        </div>)}
    </div>);
}
