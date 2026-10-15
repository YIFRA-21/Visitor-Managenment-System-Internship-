// Frontend/src/Resource/Manager/DepartmentEmployeesView.tsx
import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Mail, Phone, AlertCircle } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DepartmentEmployeesView() {
    const { t, tStatus } = useLanguage();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [hostFilter, setHostFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const fetchEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getEmployees({
                search,
                hostFilter: hostFilter !== 'ALL' ? hostFilter : undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined
            });
            setEmployees(data);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch department employees');
        }
        finally {
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
    const handleToggleHost = async (employee) => {
        setActionLoadingId(employee.id);
        try {
            const nextStatus = !employee.is_host_enabled;
            await managerApi.updateHostStatus(employee.id, {
                isHostEnabled: nextStatus
            });
            setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, is_host_enabled: nextStatus ? 1 : 0 } : e)));
        }
        catch (err) {
            alert(err?.response?.data?.message || 'Failed to update host status');
        }
        finally {
            setActionLoadingId(null);
        }
    };
    const handleChangeAvailability = async (employeeId, newStatus) => {
        setActionLoadingId(employeeId);
        try {
            await managerApi.updateHostStatus(employeeId, {
                availabilityStatus: newStatus
            });
            setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, availability_status: newStatus } : e)));
        }
        catch (err) {
            alert(err?.response?.data?.message || 'Failed to update availability');
        }
        finally {
            setActionLoadingId(null);
        }
    };
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Department Employees & Hosts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Staff Roster
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage department staff, designate authorized visitor hosts, and configure availability.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">
            Total Staff: <strong className="text-white">{employees.length}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-indigo-400">
            Active Hosts: <strong className="text-white">{employees.filter(e => e.is_host_enabled).length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee by name, email, title..." className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Host status filter */}
          <select value={hostFilter} onChange={(e) => setHostFilter(e.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="ALL">All Roles</option>
            <option value="HOSTS_ONLY">Authorized Hosts Only</option>
            <option value="NON_HOSTS">Non-Host Staff</option>
          </select>

          {/* Availability filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="ALL">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="BUSY">Busy</option>
          </select>
        </div>
      </div>

      {error && (
        <CountdownAlert
          alert={{ type: 'error', message: error }}
          onClose={() => setError('')}
          duration={10}
        />
      )}

      {/* Employees Table / Cards */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (<div className="py-16 text-center text-slate-400 text-xs animate-pulse">
            Loading department employees and host assignments...
          </div>) : employees.length === 0 ? (<div className="py-16 text-center text-slate-500 text-xs italic">
            No employees match the selected criteria.
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">{t('table.employee', 'Employee')}</th>
                  <th className="py-3.5 px-4">{t('table.position', 'Position & Office')}</th>
                  <th className="py-3.5 px-4">{t('table.contact', 'Contact')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.dutyStatus', 'Host Status')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.availability', 'Availability')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.workload', "Today's Visits")}</th>
                  <th className="py-3.5 px-4 text-right">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map((emp) => {
                const isHost = Boolean(emp.is_host_enabled);
                const isActing = actionLoadingId === emp.id;
                return (<tr key={emp.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                            {emp.first_name?.[0] || 'E'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{emp.full_name || `${emp.first_name} ${emp.last_name}`}</p>
                            <p className="text-[10px] text-slate-400">ID: {emp.employee_number || emp.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 font-medium">{emp.position || emp.job_title || 'Department Staff'}</p>
                        <p className="text-[10px] text-slate-400">{emp.office_location || 'Main Office'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500"/> {emp.email}
                        </p>
                        {emp.mobile_number && (<p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500"/> {emp.mobile_number}
                          </p>)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => handleToggleHost(emp)} disabled={isActing} className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${isHost
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
                          {isHost ? <UserCheck className="w-3 h-3"/> : <UserX className="w-3 h-3"/>}
                          <span>{isHost ? 'Active Host' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <select value={emp.availability_status} disabled={!isHost || isActing} onChange={(e) => handleChangeAvailability(emp.id, e.target.value)} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border focus:outline-none ${emp.availability_status === 'AVAILABLE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'} ${!isHost ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <option value="AVAILABLE">Available</option>
                          <option value="UNAVAILABLE">Unavailable</option>
                          <option value="ON_LEAVE">On Leave</option>
                          <option value="BUSY">Busy</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-200">
                          {emp.today_appointments_count || 0}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          / {emp.max_visitors_per_day || 10} max
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button onClick={() => handleToggleHost(emp)} disabled={isActing} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition">
                          {isHost ? 'Revoke Host' : 'Enable Host'}
                        </button>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
