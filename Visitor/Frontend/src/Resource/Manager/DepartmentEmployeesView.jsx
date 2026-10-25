// Frontend/src/Resource/Manager/DepartmentEmployeesView.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  AlertCircle,
  Eye,
  Trash2,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Building,
  Clock,
  User,
  Calendar,
  Briefcase,
  Shield,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import useResponseNavigation from '../../modules/response/useResponseNavigation';

export default function DepartmentEmployeesView() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { toError } = useResponseNavigation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [hostFilter, setHostFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modals state
  const [selectedViewEmployee, setSelectedViewEmployee] = useState(null);
  const [selectedEditEmployee, setSelectedEditEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    isHostEnabled: true,
    availabilityStatus: 'AVAILABLE',
    maxVisitorsPerDay: 10,
    officeLocation: '',
    officePhone: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const [selectedDeleteEmployee, setSelectedDeleteEmployee] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await managerApi.getEmployees({
        search,
        hostFilter: hostFilter !== 'ALL' ? hostFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch department employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [hostFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  // Toggle Host Status directly from row button
  const handleToggleHost = async (employee) => {
    setActionLoadingId(employee.id);
    try {
      const nextStatus = !employee.is_host_enabled;
      await managerApi.updateHostStatus(employee.id, {
        isHostEnabled: nextStatus
      });
      setEmployees((prev) => 
        prev.map((e) => (e.id === employee.id ? { ...e, is_host_enabled: nextStatus ? 1 : 0 } : e))
      );
      setSuccessMessage(
        nextStatus 
          ? `Employee ${employee.full_name || employee.first_name} designated as Authorized Host.` 
          : `Host authorization revoked for ${employee.full_name || employee.first_name}.`
      );
    } catch (err) {
      toError(err, {
        title: 'Host Status Update Failed',
        returnUrl: window.location.pathname + window.location.search,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Change Availability Dropdown
  const handleChangeAvailability = async (employeeId, newStatus) => {
    setActionLoadingId(employeeId);
    try {
      await managerApi.updateHostStatus(employeeId, {
        availabilityStatus: newStatus
      });
      setEmployees((prev) => 
        prev.map((e) => (e.id === employeeId ? { ...e, availability_status: newStatus } : e))
      );
      setSuccessMessage(`Availability updated to ${newStatus}.`);
    } catch (err) {
      toError(err, {
        title: 'Availability Status Update Failed',
        returnUrl: window.location.pathname + window.location.search,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit Host Settings Modal
  const handleOpenEditModal = (emp) => {
    setSelectedEditEmployee(emp);
    setEditFormData({
      isHostEnabled: Boolean(emp.is_host_enabled),
      availabilityStatus: emp.availability_status || 'AVAILABLE',
      maxVisitorsPerDay: emp.max_visitors_per_day || 10,
      officeLocation: emp.office_location || '',
      officePhone: emp.office_phone || emp.mobile_number || '',
    });
  };

  // Save Edit Host Settings
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedEditEmployee) return;
    setEditSaving(true);
    setError('');
    try {
      await managerApi.updateHostStatus(selectedEditEmployee.id, {
        isHostEnabled: editFormData.isHostEnabled,
        availabilityStatus: editFormData.availabilityStatus,
        maxVisitorsPerDay: parseInt(editFormData.maxVisitorsPerDay, 10) || 10,
        officeLocation: editFormData.officeLocation,
        officePhone: editFormData.officePhone,
      });
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEditEmployee.id
            ? {
                ...emp,
                is_host_enabled: editFormData.isHostEnabled ? 1 : 0,
                availability_status: editFormData.availabilityStatus,
                max_visitors_per_day: parseInt(editFormData.maxVisitorsPerDay, 10) || 10,
                office_location: editFormData.officeLocation,
                office_phone: editFormData.officePhone,
              }
            : emp
        )
      );
      setSuccessMessage(`Host settings saved for ${selectedEditEmployee.full_name || selectedEditEmployee.first_name}.`);
      setSelectedEditEmployee(null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update host settings');
    } finally {
      setEditSaving(false);
    }
  };

  // Confirm Delete Employee Action
  const handleConfirmDelete = async () => {
    if (!selectedDeleteEmployee) return;
    setDeleteLoading(true);
    setError('');
    try {
      await managerApi.deleteEmployee(selectedDeleteEmployee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== selectedDeleteEmployee.id));
      setSuccessMessage(`Employee ${selectedDeleteEmployee.full_name || selectedDeleteEmployee.first_name} has been removed from department roster.`);
      setSelectedDeleteEmployee(null);
      setDeleteReason('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to remove employee from department.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={`p-6 space-y-6 font-sans transition-colors duration-200 min-h-screen ${
      isDark ? 'bg-[#080d16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Department Employees & Hosts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Staff Roster
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage department staff, designate authorized visitor hosts, and configure availability.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Staff: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{employees.length}</strong>
          </span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
          <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">
            Active Hosts: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{employees.filter(e => e.is_host_enabled).length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-center justify-between transition-all duration-200 ${
        isDark ? 'bg-[#0c1322] border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search employee by name, email, title..." 
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              isDark 
                ? 'bg-[#070b13] border-slate-800 text-slate-100 placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Host status filter */}
          <select 
            value={hostFilter} 
            onChange={(e) => setHostFilter(e.target.value)} 
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium transition-colors ${
              isDark 
                ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Roles</option>
            <option value="HOSTS_ONLY">Authorized Hosts Only</option>
            <option value="NON_HOSTS">Non-Host Staff</option>
          </select>

          {/* Availability filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium transition-colors ${
              isDark 
                ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="BUSY">Busy</option>
          </select>
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

      {/* Employees Table Container */}
      <div className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-200 ${
        isDark 
          ? 'bg-[#0c1322] border-slate-800/90 shadow-[0_10px_35px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {loading ? (
          <div className={`py-16 text-center text-xs animate-pulse ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading department employees and host assignments...
          </div>
        ) : employees.length === 0 ? (
          <div className={`py-16 text-center text-xs italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No employees match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-semibold uppercase tracking-wider text-[10px] border-b transition-colors ${
                isDark 
                  ? 'bg-[#080e1b] text-slate-300 border-slate-800' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
              }`}>
                <tr>
                  <th className="py-3.5 px-4">{t('table.employee', 'Employee')}</th>
                  <th className="py-3.5 px-4">{t('table.position', 'Position & Office')}</th>
                  <th className="py-3.5 px-4">{t('table.contact', 'Contact')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.dutyStatus', 'Host Status')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.availability', 'Availability')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.workload', "Today's Workload")}</th>
                  <th className="py-3.5 px-4 text-right">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {employees.map((emp) => {
                  const isHost = Boolean(emp.is_host_enabled);
                  const isActing = actionLoadingId === emp.id;
                  return (
                    <tr 
                      key={emp.id} 
                      className={`transition-colors duration-150 ${
                        isDark ? 'hover:bg-[#111a2e]/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isHost
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              : isDark
                              ? 'bg-slate-800 border border-slate-700 text-slate-300'
                              : 'bg-slate-100 border border-slate-200 text-slate-700'
                          }`}>
                            {emp.first_name?.[0] || emp.full_name?.[0] || 'E'}
                          </div>
                          <div>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                            </p>
                            <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              ID: {emp.employee_number || emp.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {emp.position || emp.job_title || 'Department Staff'}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {emp.office_location || 'Main Office'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Mail className="w-3 h-3 text-slate-400 shrink-0"/> 
                          <span className="truncate max-w-[180px]">{emp.email}</span>
                        </p>
                        {emp.mobile_number && (
                          <p className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Phone className="w-3 h-3 text-slate-400 shrink-0"/> {emp.mobile_number}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => handleToggleHost(emp)} 
                          disabled={isActing} 
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                            isHost
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : isDark
                              ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                          }`}
                          title={isHost ? "Click to revoke host status" : "Click to enable host status"}
                        >
                          {isHost ? <UserCheck className="w-3 h-3"/> : <UserX className="w-3 h-3"/>}
                          <span>{isHost ? 'Active Host' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <select 
                          value={emp.availability_status || 'AVAILABLE'} 
                          disabled={!isHost || isActing} 
                          onChange={(e) => handleChangeAvailability(emp.id, e.target.value)} 
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border focus:outline-none transition-colors ${
                            emp.availability_status === 'AVAILABLE'
                              ? isDark 
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : emp.availability_status === 'BUSY'
                              ? isDark 
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' 
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                              : emp.availability_status === 'ON_LEAVE'
                              ? isDark 
                                ? 'bg-purple-950/40 text-purple-300 border-purple-500/40' 
                                : 'bg-purple-50 text-purple-700 border-purple-300'
                              : isDark 
                                ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' 
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                          } ${!isHost ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="AVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Available</option>
                          <option value="UNAVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Unavailable</option>
                          <option value="ON_LEAVE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>On Leave</option>
                          <option value="BUSY" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Busy</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {emp.today_appointments_count || 0}
                        </span>
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          / {emp.max_visitors_per_day || 10} max
                        </span>
                      </td>

                      {/* ── Modern Action Icon Group ── */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Employee Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedViewEmployee(emp)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isDark 
                                ? 'bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border-slate-700 hover:border-indigo-500/50' 
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300'
                            }`}
                            title="View Employee Profile & Schedule"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Configure Host Settings */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(emp)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isDark 
                                ? 'bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border-slate-700 hover:border-blue-500/50' 
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-300'
                            }`}
                            title="Configure Host Limits & Office"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Quick Host Status Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleHost(emp)}
                            disabled={isActing}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                              isHost
                                ? isDark 
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30 hover:border-emerald-400' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300'
                                : isDark
                                ? 'bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/40'
                                : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border-slate-200 hover:border-amber-300'
                            } ${isActing ? 'opacity-50 cursor-wait' : ''}`}
                            title={isHost ? 'Revoke Host Authorization' : 'Authorize as Visitor Host'}
                          >
                            {isHost ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          </button>

                          {/* 4. Direct Email */}
                          {emp.email && (
                            <a
                              href={`mailto:${emp.email}?subject=Department%20Host%20Notification`}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                                isDark 
                                  ? 'bg-slate-800/80 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border-slate-700 hover:border-sky-500/50' 
                                  : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border-slate-200 hover:border-sky-300'
                              }`}
                              title={`Send Email to ${emp.full_name || emp.first_name}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* 5. Delete Employee / Remove Roster */}
                          <button
                            type="button"
                            onClick={() => setSelectedDeleteEmployee(emp)}
                            disabled={isActing}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm group ${
                              isDark 
                                ? 'bg-slate-800/80 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 border-slate-700 hover:border-rose-500/50' 
                                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200 hover:border-rose-300'
                            }`}
                            title="Delete Employee from Department"
                          >
                            <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. VIEW EMPLOYEE PROFILE & DETAILS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedViewEmployee && (
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
                  {selectedViewEmployee.first_name?.[0] || selectedViewEmployee.full_name?.[0] || 'E'}
                </div>
                <div>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedViewEmployee.full_name || `${selectedViewEmployee.first_name} ${selectedViewEmployee.last_name}`}
                  </h3>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                    {selectedViewEmployee.position || selectedViewEmployee.job_title || 'Department Staff'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedViewEmployee(null)}
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
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</span>
                <span className={`text-xs font-bold ${
                  selectedViewEmployee.is_host_enabled ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {selectedViewEmployee.is_host_enabled ? 'Active Host' : 'Non-Host'}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Availability</span>
                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
                  {selectedViewEmployee.availability_status || 'AVAILABLE'}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Max Visits/Day</span>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedViewEmployee.max_visitors_per_day || 10}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className={`space-y-3 text-xs p-4 rounded-2xl border ${
              isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between py-1 border-b ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <User className="w-3.5 h-3.5 text-slate-400" /> Employee ID
                </span>
                <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedViewEmployee.employee_number || selectedViewEmployee.id}
                </span>
              </div>

              <div className={`flex items-center justify-between py-1 border-b ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                </span>
                <span className={`font-medium truncate max-w-[240px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedViewEmployee.email}
                </span>
              </div>

              <div className={`flex items-center justify-between py-1 border-b ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Contact
                </span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedViewEmployee.mobile_number || selectedViewEmployee.office_phone || 'N/A'}
                </span>
              </div>

              <div className={`flex items-center justify-between py-1 border-b ${
                isDark ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Office / Desk
                </span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedViewEmployee.office_location || 'Main Office'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Today's Booked Visits
                </span>
                <span className="font-bold text-indigo-500 dark:text-indigo-400">
                  {selectedViewEmployee.today_appointments_count || 0} scheduled
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const emp = selectedViewEmployee;
                  setSelectedViewEmployee(null);
                  handleOpenEditModal(emp);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Host</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedViewEmployee(null)}
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
      {/* 2. CONFIGURE / EDIT HOST SETTINGS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedEditEmployee && (
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
                    {selectedEditEmployee.full_name || selectedEditEmployee.first_name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEditEmployee(null)} 
                className={`transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Host Toggle Switch */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-[#070b13] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Authorized Visitor Host</span>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Allow this employee to host visitor appointments.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isHostEnabled}
                    onChange={(e) => setEditFormData({ ...editFormData, isHostEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Availability Status */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Availability Status
                </label>
                <select
                  value={editFormData.availabilityStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, availabilityStatus: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isDark 
                      ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="AVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Available (Online to host)</option>
                  <option value="UNAVAILABLE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Unavailable (Away from desk)</option>
                  <option value="ON_LEAVE" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>On Leave</option>
                  <option value="BUSY" className={isDark ? 'bg-[#0c1322] text-white' : 'bg-white text-slate-900'}>Busy (In active session)</option>
                </select>
              </div>

              {/* Max Visitors Per Day */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Daily Visitor Workload Limit
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
                  onClick={() => setSelectedEditEmployee(null)}
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3. DELETE EMPLOYEE CONFIRMATION MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedDeleteEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`border rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
            isDark 
              ? 'bg-[#0c1322] border-rose-500/40 text-white' 
              : 'bg-white border-rose-500/40 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Remove Employee from Roster</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedDeleteEmployee(null)} 
                className={`transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 space-y-1">
              <p className="font-bold">Are you sure you want to remove this employee?</p>
              <p className="text-[11px] opacity-90">
                Employee: <strong>{selectedDeleteEmployee.full_name || selectedDeleteEmployee.first_name}</strong> (ID: {selectedDeleteEmployee.employee_number || selectedDeleteEmployee.id})
              </p>
              <p className={`text-[10px] pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                This will revoke their visitor hosting privileges and archive them from active department scheduling.
              </p>
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Reason for Removal (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Transferred to another department, Resigned, Inactive"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  isDark 
                    ? 'bg-[#070b13] border-slate-800 text-slate-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedDeleteEmployee(null)}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
