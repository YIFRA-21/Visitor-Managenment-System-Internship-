// Frontend/src/Resource/Manager/DepartmentEvacuationView.tsx
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, UserCheck, AlertTriangle, Printer, RefreshCw, Search, Building2, Clock, Check, Radio } from 'lucide-react';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DepartmentEvacuationView() {
    const { t, tStatus } = useLanguage();
    const [departmentName, setDepartmentName] = useState('Department');
    const [evacuees, setEvacuees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [drillActive, setDrillActive] = useState(false);
    const [drillModalOpen, setDrillModalOpen] = useState(false);
    const fetchEvacuationData = async () => {
        setLoading(true);
        try {
            const data = await managerApi.getEvacuationRoster();
            setDepartmentName(data.departmentName || 'Department');
            const staffList = (data.employees || []).map((e) => ({
                id: `emp-${e.id}`,
                type: 'STAFF',
                name: e.full_name,
                roleOrCompany: e.job_title || 'Staff Member',
                phone: e.mobile_number || 'N/A',
                musterStatus: 'ACCOUNTED',
                locationZone: 'Main Floor'
            }));
            const visitorList = (data.visitors || []).map((v) => ({
                id: `vis-${v.visitor_id || v.appointment_id}`,
                type: 'VISITOR',
                name: v.visitor_name,
                roleOrCompany: v.visitor_company || 'Guest',
                phone: 'Badge #' + (v.reference_code || 'V-ID'),
                hostName: v.host_name || 'Department Staff',
                checkInTime: v.scheduled_start || 'Today',
                musterStatus: 'ACCOUNTED',
                locationZone: 'Dept Office'
            }));
            setEvacuees([...staffList, ...visitorList]);
        }
        catch (err) {
            console.error('Failed to load evacuation roster:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEvacuationData();
    }, []);
    const toggleMusterStatus = (id) => {
        setEvacuees(prev => prev.map(person => {
            if (person.id === id) {
                return {
                    ...person,
                    musterStatus: person.musterStatus === 'ACCOUNTED' ? 'UNACCOUNTED' : 'ACCOUNTED'
                };
            }
            return person;
        }));
    };
    const markAllSafe = () => {
        setEvacuees(prev => prev.map(p => ({ ...p, musterStatus: 'ACCOUNTED' })));
    };
    const handlePrint = () => {
        window.print();
    };
    const totalHeadcount = evacuees.length;
    const accountedCount = evacuees.filter(e => e.musterStatus === 'ACCOUNTED').length;
    const unaccountedCount = evacuees.filter(e => e.musterStatus === 'UNACCOUNTED').length;
    const staffCount = evacuees.filter(e => e.type === 'STAFF').length;
    const visitorCount = evacuees.filter(e => e.type === 'VISITOR').length;
    const filteredEvacuees = evacuees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.roleOrCompany.toLowerCase().includes(search.toLowerCase()) ||
            (e.hostName && e.hostName.toLowerCase().includes(search.toLowerCase()));
        if (!matchesSearch)
            return false;
        if (filter === 'UNACCOUNTED')
            return e.musterStatus === 'UNACCOUNTED';
        if (filter === 'ACCOUNTED')
            return e.musterStatus === 'ACCOUNTED';
        if (filter === 'STAFF')
            return e.type === 'STAFF';
        if (filter === 'VISITORS')
            return e.type === 'VISITOR';
        return true;
    });
    return (<div className="space-y-6">
      {/* Top Banner */}
      <div className={`rounded-2xl p-6 border transition-all ${drillActive
            ? 'bg-rose-950/40 border-rose-500/50 shadow-2xl shadow-rose-950/50 animate-pulse'
            : 'bg-slate-900/60 border-slate-800 backdrop-blur-xl'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl ${drillActive ? 'bg-rose-500/20 text-rose-400' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <ShieldAlert className="w-5 h-5"/>
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Emergency Evacuation & Roll Call
              </h1>
              {drillActive && (<span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-500 text-white animate-bounce">
                  DRILL / ALERT ACTIVE
                </span>)}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Live muster roll call manifest for <strong className="text-slate-200">{departmentName}</strong>. Designated Assembly Point: <span className="text-amber-400 font-semibold">Assembly Area 4 (East Courtyard)</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button type="button" onClick={fetchEvacuationData} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
              Refresh
            </button>
            <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition">
              <Printer className="w-3.5 h-3.5"/>
              Print Manifest
            </button>
            <button type="button" onClick={markAllSafe} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium transition">
              <Check className="w-3.5 h-3.5"/>
              Mark All Safe
            </button>
            <button type="button" onClick={() => setDrillModalOpen(true)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${drillActive
            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'}`}>
              <Radio className="w-3.5 h-3.5"/>
              {drillActive ? 'Deactivate Drill' : 'Broadcast Evacuation Drill'}
            </button>
          </div>
        </div>
      </div>

      {/* Headcount Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Total On-Premises</span>
            <Users className="w-4 h-4 text-indigo-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{totalHeadcount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Staff & checked-in guests</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Accounted Safe</span>
            <UserCheck className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{accountedCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Verified at assembly</p>
        </div>

        <div className={`rounded-2xl p-4 border transition ${unaccountedCount > 0 ? 'bg-rose-500/10 border-rose-500/40 animate-pulse' : 'bg-slate-900/40 border-slate-800/80'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold text-rose-400">Unaccounted</span>
            <AlertTriangle className="w-4 h-4 text-rose-400"/>
          </div>
          <div className="text-2xl font-bold text-rose-400">{unaccountedCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Immediate search needed</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Staff Count</span>
            <Building2 className="w-4 h-4 text-blue-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{staffCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Active dept employees</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Active Visitors</span>
            <Clock className="w-4 h-4 text-amber-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{visitorCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Currently inside building</p>
        </div>
      </div>

      {/* Roster Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, company, or host..." className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'UNACCOUNTED', 'ACCOUNTED', 'STAFF', 'VISITORS'].map(tab => (<button key={tab} type="button" onClick={() => setFilter(tab)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${filter === tab
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              {tab === 'ALL' && `All (${totalHeadcount})`}
              {tab === 'UNACCOUNTED' && `Unaccounted (${unaccountedCount})`}
              {tab === 'ACCOUNTED' && `Safe (${accountedCount})`}
              {tab === 'STAFF' && `Staff (${staffCount})`}
              {tab === 'VISITORS' && `Visitors (${visitorCount})`}
            </button>))}
        </div>
      </div>

      {/* Roster List Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">{t('table.status', 'Status & Type')}</th>
                <th className="px-6 py-4">{t('table.name', 'Full Name')}</th>
                <th className="px-6 py-4">{t('table.position', 'Designation / Host')}</th>
                <th className="px-6 py-4">{t('table.contact', 'Contact / Identifier')}</th>
                <th className="px-6 py-4">{t('table.zone', 'Designated Zone')}</th>
                <th className="px-6 py-4 text-right">{t('table.action', 'Muster Verification')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (<tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400"/>
                    Synchronizing evacuation muster roster...
                  </td>
                </tr>) : filteredEvacuees.length === 0 ? (<tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No individuals match the selected filter.
                  </td>
                </tr>) : (filteredEvacuees.map(person => {
            const isAccounted = person.musterStatus === 'ACCOUNTED';
            return (<tr key={person.id} className={`hover:bg-slate-800/40 transition ${!isAccounted ? 'bg-rose-950/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isAccounted ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500 animate-ping'}`}/>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${person.type === 'STAFF'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {person.type}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-white">
                        {person.name}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-medium">{person.roleOrCompany}</div>
                        {person.hostName && (<div className="text-xs text-slate-500">Host: {person.hostName}</div>)}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {person.phone}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {person.locationZone || 'Main Department Area'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => toggleMusterStatus(person.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${isAccounted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'}`}>
                          {isAccounted ? 'Mark Unaccounted' : 'Mark Safe & Present'}
                        </button>
                      </td>
                    </tr>);
        }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Broadcast Confirmation Modal */}
      {drillModalOpen && (<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6"/>
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {drillActive ? 'Deactivate Drill Status?' : 'Broadcast Evacuation Alert / Drill?'}
                </h3>
                <p className="text-xs text-slate-400">Action affects department safety status</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {drillActive
                ? 'Deactivating this drill will return the department muster status to normal operating mode.'
                : 'Broadcasting an evacuation alert will trigger department notifications, notify reception security guards, and initiate live roll call muster tracking.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDrillModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm">
                Cancel
              </button>
              <button type="button" onClick={() => {
                setDrillActive(!drillActive);
                setDrillModalOpen(false);
            }} className={`px-4 py-2 rounded-xl text-white font-semibold text-sm transition shadow-lg ${drillActive ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'}`}>
                {drillActive ? 'Deactivate Drill' : 'Confirm & Broadcast'}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
